import {useSelector} from 'react-redux';
import {useCallback, useEffect, useRef, useState} from 'react';

import {BURN_ADDRESS} from '../../../util/constants';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {normalizeString} from '../../../util/helpers';
import {ProposalFlowStatus, ProposalData, ProposalFlag} from '../types';
import {proposalHasFlag} from '../helpers';
import {StoreState} from '../../../store/types';
import {useOffchainVotingStartEnd} from '.';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingState} from '../voting/types';

// @todo Logic to fall back to on-chain polling this if subgraph is not available

type UseProposalWithOffchainVoteStatusReturn = {
  status: ProposalFlowStatus | undefined;
  daoProposal: {adapterAddress: string; flags: number} | undefined;
  daoProposalVotes:
    | {
        fallbackVotesCount: string;
        gracePeriodStartingTime: string;
        index: string;
        isChallenged: boolean;
        nbNo: string;
        nbVoters: string;
        nbYes: string;
        proposalHash: string;
        reporter: string;
        resultRoot: string;
        snapshot: string;
        startingTime: string;
      }
    | undefined;
  /**
   * An enum index (string) of the DAO proposal's `VotingState`
   */
  daoProposalVoteResult: string | undefined;
  transitionMessage: string | undefined;
};

export function useProposalWithOffchainVoteStatus(
  proposal: ProposalData
): UseProposalWithOffchainVoteStatusReturn {
  const {snapshotDraft, snapshotProposal} = proposal;
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
  const offchainVotingAddress = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.contractAddress
  );
  const offchainVotingABI = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.abi
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
   * Cached callbacks
   */

  const pollStatusFromContractCached = useCallback(pollStatusFromContract, [
    daoRegistryABI,
    daoRegistryAddress,
    offchainVotingABI,
    offchainVotingAddress,
    proposalId,
    web3Instance,
  ]);

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

  /**
   * Check if vote result was submitted.
   * We can do this by checking if `reporter` and `resultRoot` has been set.
   *
   * @see `submitVoteResult` in molochv3-contracts off-chain voting adapters
   */
  const offchainResultSubmitted =
    daoProposalVotes &&
    daoProposalVotes.reporter &&
    normalizeString(daoProposalVotes.reporter) !== BURN_ADDRESS &&
    daoProposalVotes.resultRoot &&
    normalizeString(daoProposalVotes.resultRoot) !== BURN_ADDRESS;

  const isInVotingGracePeriod =
    daoProposalVoteResult &&
    VotingState[daoProposalVoteResult] ===
      VotingState[VotingState.GRACE_PERIOD];

  useEffect(() => {
    // Call as soon as possible.
    pollStatusFromContractCached();

    // Then, poll every `x` Ms
    const intervalId = setInterval(pollStatusFromContractCached, 5000);

    pollingIntervalIdRef.current = intervalId;
  }, [pollStatusFromContractCached]);

  // Stop polling if propsal is processed
  useEffect(() => {
    if (atProcessedInDAO && pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);
    }

    return () => {
      pollingIntervalIdRef.current &&
        clearInterval(pollingIntervalIdRef.current);
    };
  }, [atProcessedInDAO]);

  /**
   * Functions
   */

  function getReturnData(
    status: ProposalFlowStatus | undefined,
    transitionMessage?: string
  ): UseProposalWithOffchainVoteStatusReturn {
    return {
      status,
      transitionMessage,
      daoProposal,
      daoProposalVoteResult,
      daoProposalVotes,
    };
  }

  async function pollStatusFromContract() {
    try {
      if (
        !daoRegistryABI ||
        !daoRegistryAddress ||
        !offchainVotingABI ||
        !offchainVotingAddress ||
        !proposalId
      ) {
        return;
      }

      const proposalsABI = daoRegistryABI.filter(
        (item) => item.name === 'proposals'
      )[0];
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
    } catch (error) {}
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
    status: undefined,
    transitionMessage: undefined,
    daoProposal,
    daoProposalVoteResult,
    daoProposalVotes,
  };
}
