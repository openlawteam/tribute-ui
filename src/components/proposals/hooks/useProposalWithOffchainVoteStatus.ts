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
import {ENVIRONMENT} from '../../../config';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {normalizeString} from '../../../util/helpers';
import {proposalHasFlag} from '../helpers';
import {StoreState} from '../../../store/types';
import {useTimeStartEnd} from '../../../hooks';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingState} from '../voting/types';

// @todo Logic to fall back to on-chain polling this if subgraph is not available

type UseProposalWithOffchainVoteStatusReturn = {
  daoProposal: {adapterAddress: string; flags: number} | undefined;
  daoProposalVotes: OffchainVotingAdapterVotes | undefined;
  /**
   * An enum name (`string`) of the DAO proposal's `VotingState` index
   */
  daoProposalVoteResult: typeof VotingState[any] | undefined;
  proposalFlowStatusError: Error | undefined;
  status: ProposalFlowStatus | undefined;
};

const DEFAULT_POLL_INTERVAL_MS: number =
  ENVIRONMENT === 'production' ? 15000 : 5000;

export function useProposalWithOffchainVoteStatus(
  proposal: ProposalData,
  options?: {pollInterval?: number}
): UseProposalWithOffchainVoteStatusReturn {
  const {daoProposalVotingAdapter, snapshotDraft, snapshotProposal} = proposal;
  const {votes: snapshotVotes} = snapshotProposal || {};
  const proposalId = snapshotDraft?.idInDAO || snapshotProposal?.idInDAO;
  const {pollInterval = DEFAULT_POLL_INTERVAL_MS} = options || {};

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

  const [daoProposal, setDAOProposal] =
    useState<UseProposalWithOffchainVoteStatusReturn['daoProposal']>();
  const [daoProposalVotes, setDAOProposalVotes] =
    useState<UseProposalWithOffchainVoteStatusReturn['daoProposalVotes']>();
  const [daoProposalVoteResult, setDAOProposalVoteResult] =
    useState<
      UseProposalWithOffchainVoteStatusReturn['daoProposalVoteResult']
    >();

  const [proposalFlowStatusError, setProposalFlowStatusError] =
    useState<Error>();

  /**
   * Refs
   */

  const pollingIntervalIdRef = useRef<NodeJS.Timeout>();
  const stopPollingRef = useRef<boolean>(false);

  /**
   * Our hooks
   */

  const {hasTimeStarted, hasTimeEnded, timeStartEndInitReady} = useTimeStartEnd(
    proposal.snapshotProposal?.msg.payload.start,
    proposal.snapshotProposal?.msg.payload.end
  );

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
   * @see `submitVoteResult` in tribute-contracts off-chain voting adapters
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

  const getStatusFromContractCached = useCallback(getStatusFromContract, [
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
    getStatusFromContractCached().catch((error) => {
      setProposalFlowStatusError(error);
    });
  }, [getStatusFromContractCached]);

  useEffect(() => {
    /**
     * Stop polling if processed:
     * Set our ref to be accessed inside of the polling interval callback
     */
    if (atProcessedInDAO) {
      stopPollingRef.current = true;
    }

    // Clear any previous intervals
    if (pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);
    }

    // Then, poll every `x` Ms
    const intervalId = setInterval(async () => {
      try {
        if (stopPollingRef.current && pollingIntervalIdRef.current) {
          clearInterval(pollingIntervalIdRef.current);
        }

        await getStatusFromContractCached();
      } catch (error) {
        pollingIntervalIdRef.current &&
          clearInterval(pollingIntervalIdRef.current);

        setProposalFlowStatusError(error);
      }
    }, pollInterval);

    pollingIntervalIdRef.current = intervalId;
  }, [atProcessedInDAO, pollInterval, getStatusFromContractCached]);

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

  async function getStatusFromContract() {
    try {
      if (
        !daoRegistryABI ||
        !daoRegistryAddress ||
        !proposalId ||
        !web3Instance
      ) {
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

  // Status: Submit
  if (timeStartEndInitReady && !hasTimeStarted && !atExistsInDAO) {
    return getReturnData(ProposalFlowStatus.Submit);
  }

  // Status: Sponsor
  if (timeStartEndInitReady && !hasTimeStarted && atExistsInDAO) {
    return getReturnData(ProposalFlowStatus.Sponsor);
  }

  // Status: Off-chain Voting
  if (
    timeStartEndInitReady &&
    hasTimeStarted &&
    !hasTimeEnded &&
    atSponsoredInDAO
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVoting);
  }

  // Status: If no votes, skip `OffchainVotingSubmitResult` and set to `OffchainVotingGracePeriod` or `Process`
  if (
    timeStartEndInitReady &&
    hasTimeEnded &&
    atSponsoredInDAO &&
    !snapshotVotes?.length &&
    !offchainResultSubmitted
  ) {
    return getReturnData(
      isInVotingGracePeriod
        ? ProposalFlowStatus.OffchainVotingGracePeriod
        : ProposalFlowStatus.Process
    );
  }

  // Status: Ready to Submit Vote Result
  if (
    timeStartEndInitReady &&
    hasTimeEnded &&
    atSponsoredInDAO &&
    !offchainResultSubmitted
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingSubmitResult);
  }

  // Status: Grace period
  if (
    timeStartEndInitReady &&
    hasTimeEnded &&
    atSponsoredInDAO &&
    offchainResultSubmitted &&
    isInVotingGracePeriod
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingGracePeriod);
  }

  // Status: Process
  if (
    atSponsoredInDAO &&
    timeStartEndInitReady &&
    hasTimeEnded &&
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
