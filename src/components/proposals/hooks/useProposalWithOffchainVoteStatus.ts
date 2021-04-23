import {useSelector} from 'react-redux';
import {useCallback, useEffect, useRef, useState} from 'react';
import {isAddress} from 'web3-utils';

import {
  ProposalFlowStatus,
  ProposalData,
  ProposalFlag,
  OffchainVotingAdapterVotes,
} from '../types';
import {BURN_ADDRESS} from '../../../util/constants';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {normalizeString} from '../../../util/helpers';
import {proposalHasFlag} from '../helpers';
import {StoreState} from '../../../store/types';
import {useOffchainVotingStartEnd} from '.';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingState} from '../voting/types';

// @todo Logic to fall back to on-chain polling this if subgraph is not available

type UseProposalWithOffchainVoteStatusReturn = {
  daoProposal: {adapterAddress: string; flags: number} | undefined;
  daoProposalVotes: OffchainVotingAdapterVotes | undefined;
  /**
   * An enum index (string) of the DAO proposal's `VotingState`
   */
  daoProposalVoteResult: string | undefined;
  proposalFlowStatusError: Error | undefined;
  status: ProposalFlowStatus | undefined;
};

const POLL_INTERVAL_MS: number = 5000;

export function useProposalWithOffchainVoteStatus(
  proposal: ProposalData
): UseProposalWithOffchainVoteStatusReturn {
  const {daoProposalVotingAdapter, snapshotDraft, snapshotProposal} = proposal;
  const proposalId = snapshotDraft?.idInDAO || snapshotProposal?.idInDAO;

  /**
   * Selectors
   */

  const {web3Instance} = useWeb3Modal();
  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );
  const daoRegistryABI = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  );

  /**
   * State
   */

  const [daoProposal, setDAOProposal] = useState<
    UseProposalWithOffchainVoteStatusReturn['daoProposal']
  >();
  const [daoProposalVotes, setDAOProposalVotes] = useState<
    UseProposalWithOffchainVoteStatusReturn['daoProposalVotes']
  >();
  const [daoProposalVoteResult, setDAOProposalVoteResult] = useState<
    UseProposalWithOffchainVoteStatusReturn['daoProposalVoteResult']
  >();

  const [
    proposalFlowStatusError,
    setProposalFlowStatusError,
  ] = useState<Error>();

  /**
   * Refs
   */

  const pollingIntervalIdRef = useRef<NodeJS.Timeout>();

  /**
   * Our hooks
   */

  const {
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  /**
   * Variables
   */

  const atExistsInDAO = daoProposal
    ? proposalHasFlag(ProposalFlag.EXISTS, daoProposal.flags)
    : false;
  const atSponsoredInDAO = daoProposal
    ? proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags)
    : false;
  const atProcessedInDAO = daoProposal
    ? proposalHasFlag(ProposalFlag.PROCESSED, daoProposal.flags)
    : false;

  const offchainVotingAddress = daoProposalVotingAdapter?.votingAdapterAddress;
  const offchainVotingABI = daoProposalVotingAdapter?.getVotingAdapterABI();

  /**
   * Check if vote result was submitted.
   * We can do this by checking if `reporter` and `resultRoot` has been set.
   *
   * @see `submitVoteResult` in molochv3-contracts off-chain voting adapters
   */
  const offchainResultSubmitted: boolean =
    daoProposalVotes !== undefined &&
    isAddress(daoProposalVotes.reporter) &&
    normalizeString(daoProposalVotes.reporter) !== BURN_ADDRESS;

  const isInVotingGracePeriod: boolean =
    daoProposalVoteResult !== undefined &&
    VotingState[daoProposalVoteResult] ===
      VotingState[VotingState.GRACE_PERIOD];

  /**
   * Cached callbacks
   */

  const pollStatusFromContractCached = useCallback(pollStatusFromContract, [
    daoProposalVotingAdapter,
    daoRegistryABI,
    daoRegistryAddress,
    offchainVotingABI,
    offchainVotingAddress,
    proposalId,
    web3Instance,
  ]);

  useEffect(() => {
    // Call as soon as possible.
    pollStatusFromContractCached()
      .then(() => {
        // Clear any previous intervals
        if (pollingIntervalIdRef.current) {
          clearInterval(pollingIntervalIdRef.current);
        }

        // Then, poll every `x` Ms
        const intervalId = setInterval(async () => {
          try {
            await pollStatusFromContractCached();
          } catch (error) {
            pollingIntervalIdRef.current &&
              clearInterval(pollingIntervalIdRef.current);

            setProposalFlowStatusError(error);
          }
        }, POLL_INTERVAL_MS);

        pollingIntervalIdRef.current = intervalId;
      })
      .catch((error) => {
        setProposalFlowStatusError(error);
      });
  }, [pollStatusFromContractCached]);

  // Stop polling if propsal is processed
  useEffect(() => {
    if (atProcessedInDAO && pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);
    }

    // Cleanup polling on unmount
    return () => {
      pollingIntervalIdRef.current &&
        clearInterval(pollingIntervalIdRef.current);
    };
  }, [atProcessedInDAO]);

  /**
   * Functions
   */

  function getReturnData(
    status: ProposalFlowStatus | undefined
  ): UseProposalWithOffchainVoteStatusReturn {
    return {
      daoProposal,
      daoProposalVoteResult,
      daoProposalVotes,
      proposalFlowStatusError,
      status,
    };
  }

  async function pollStatusFromContract() {
    try {
      if (!daoRegistryABI || !daoRegistryAddress || !proposalId) {
        return;
      }

      const proposalsABI = daoRegistryABI.filter(
        (item) => item.name === 'proposals'
      )[0];

      /**
       * If there is no voting adapter (i.e. the proposal is not yet sponsored)
       * then only call the DAO for the proposal data and exit early.
       */
      if (!daoProposalVotingAdapter) {
        const [proposal] = await multicall({
          calls: [
            // DAO proposals call
            [daoRegistryAddress, proposalsABI, [proposalId]],
          ],
          web3Instance,
        });

        setDAOProposal(proposal);

        return;
      }

      if (!offchainVotingABI || !offchainVotingAddress) return;

      const voteResultABI = offchainVotingABI.filter(
        (item) => item.name === 'voteResult'
      )[0];
      const votesABI = offchainVotingABI.filter(
        (item) => item.name === 'votes'
      )[0];

      const calls: MulticallTuple[] = [
        // DAO proposals call
        [daoRegistryAddress, proposalsABI, [proposalId]],
        // Votes call
        [offchainVotingAddress, votesABI, [daoRegistryAddress, proposalId]],
        // Vote result call
        [
          offchainVotingAddress,
          voteResultABI,
          [daoRegistryAddress, proposalId],
        ],
      ];

      const [proposal, votes, voteResult] = await multicall({
        calls,
        web3Instance,
      });

      setDAOProposal(proposal);
      setDAOProposalVotes(votes);
      setDAOProposalVoteResult(voteResult);
    } catch (error) {
      throw error;
    }
  }

  // Status: Sponsor
  if (
    offchainVotingStartEndInitReady &&
    !hasOffchainVotingStarted &&
    atExistsInDAO
  ) {
    return getReturnData(ProposalFlowStatus.Sponsor);
  }

  // Status: Off-chain Voting
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingStarted &&
    !hasOffchainVotingEnded &&
    atSponsoredInDAO
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVoting);
  }

  // Status: Ready to Submit Vote Result
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    atSponsoredInDAO &&
    !offchainResultSubmitted
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingSubmitResult);
  }

  // Status: Grace period
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    atSponsoredInDAO &&
    offchainResultSubmitted &&
    isInVotingGracePeriod
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingGracePeriod);
  }

  // Status: Process
  if (
    atSponsoredInDAO &&
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    offchainResultSubmitted &&
    !isInVotingGracePeriod
  ) {
    return getReturnData(ProposalFlowStatus.Process);
  }

  // Status: Processed (completed)
  if (atProcessedInDAO) {
    return getReturnData(ProposalFlowStatus.Completed);
  }

  // Fallthrough
  return {
    daoProposal,
    daoProposalVoteResult,
    daoProposalVotes,
    proposalFlowStatusError,
    status: undefined,
  };
}
