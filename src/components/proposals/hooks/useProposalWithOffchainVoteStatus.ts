import {useSelector} from 'react-redux';
import {useCallback, useEffect, useRef, useState} from 'react';
import {isAddress} from 'web3-utils';

import {
  ProposalFlowStatus,
  ProposalData,
  ProposalFlag,
  OffchainVotingAdapterVote,
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

type UseProposalWithOffchainVoteStatusReturn = {
  daoProposal: {adapterAddress: string; flags: number} | undefined;
  daoProposalVote: OffchainVotingAdapterVote | undefined;
  /**
   * An enum name (`string`) of the DAO proposal's `VotingState` index
   */
  daoProposalVoteResult: typeof VotingState[any] | undefined;
  proposalFlowStatusError: Error | undefined;
  status: ProposalFlowStatus | undefined;
};

type UseProposalWithOffchainVoteStatusProps = {
  /**
   * Voting start time
   * i.e. calculated from the `OffchainVoting` contract's vote's start time, or Snapshot proposal's start time.
   *
   * If not available and/or determined, use `0`.
   */
  countdownVotingStartMs: number;
  /**
   * Voting end time
   * i.e. calculated from the `OffchainVoting` contract's vote's end time, or Snapshot proposal's end time
   *
   * If not available and/or determined, use `0`.
   */
  countdownVotingEndMs: number;
  proposal: ProposalData;
  /**
   * Defaults to `DEFAULT_POLL_INTERVAL_MS`:
   *  - Production: 15000ms
   *  - Development: 5000ms
   */
  pollInterval?: number;
};

const DEFAULT_POLL_INTERVAL_MS: number =
  ENVIRONMENT === 'production' ? 15000 : 5000;

/**
 * Derives where in the "proposal flow" a proposal currently is.
 *
 * Most flow states are derived from the contract.
 * Determing whether a proposal is in voting works a bit differently, depending
 * on which vote start and end times are to be used (i.e. Snapshot proposal vs. Contract proposal).
 *
 * Therefore, we pass these two timing values as props to be more agnostic.
 *
 * @param UseProposalWithOffchainVoteStatusProps
 * @returns `UseProposalWithOffchainVoteStatusReturn`
 */
export function useProposalWithOffchainVoteStatus({
  countdownVotingEndMs,
  countdownVotingStartMs,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  proposal,
}: UseProposalWithOffchainVoteStatusProps): UseProposalWithOffchainVoteStatusReturn {
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

  const [daoProposalVote, setDAOProposalVote] =
    useState<UseProposalWithOffchainVoteStatusReturn['daoProposalVote']>();

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

  const {
    hasTimeStarted: hasVotingStarted,
    hasTimeEnded: hasVotingEnded,
    timeStartEndInitReady,
  } = useTimeStartEnd(countdownVotingStartMs, countdownVotingEndMs);

  /**
   * Variables
   */

  const {
    Completed,
    OffchainVoting,
    OffchainVotingGracePeriod,
    OffchainVotingSubmitResult,
    Process,
    Sponsor,
    Submit,
  } = ProposalFlowStatus;

  const {daoProposalVotingAdapter, snapshotDraft, snapshotProposal} = proposal;
  const {votes: snapshotVotes} = snapshotProposal || {};
  const proposalId = snapshotDraft?.idInDAO || snapshotProposal?.idInDAO;

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
    daoProposalVote !== undefined &&
    isAddress(daoProposalVote.reporter) &&
    normalizeString(daoProposalVote.reporter) !== BURN_ADDRESS;

  const isInVotingGracePeriod: boolean =
    VotingState[daoProposalVoteResult || ''] ===
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

  /**
   * Effects
   */

  // Get status as soon as possible.
  useEffect(() => {
    getStatusFromContractCached().catch((error) => {
      setProposalFlowStatusError(error);
    });
  }, [getStatusFromContractCached]);

  // Poll for status, etc.
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
    return function cleanup() {
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
      daoProposalVote,
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

      const voteABI = offchainVotingABI.filter(
        (item) => item.name === 'votes'
      )[0];

      const calls: MulticallTuple[] = [
        // DAO proposals call
        [daoRegistryAddress, proposalsABI, [proposalId]],
        // Vote data call
        [offchainVotingAddress, voteABI, [daoRegistryAddress, proposalId]],
        // Vote result (state) call
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
      setDAOProposalVote(votes);
      setDAOProposalVoteResult(voteResult);
    } catch (error) {
      throw error;
    }
  }

  // Status: Submit
  if (timeStartEndInitReady && !hasVotingStarted && !atExistsInDAO) {
    return getReturnData(Submit);
  }

  // Status: Sponsor
  if (timeStartEndInitReady && !hasVotingStarted && atExistsInDAO) {
    return getReturnData(Sponsor);
  }

  // Status: Off-chain Voting
  if (
    timeStartEndInitReady &&
    hasVotingStarted &&
    !hasVotingEnded &&
    atSponsoredInDAO
  ) {
    return getReturnData(OffchainVoting);
  }

  // Status: If no votes, skip `OffchainVotingSubmitResult` and set to `OffchainVotingGracePeriod` or `Process`
  if (
    timeStartEndInitReady &&
    hasVotingEnded &&
    atSponsoredInDAO &&
    !snapshotVotes?.length &&
    !offchainResultSubmitted
  ) {
    return getReturnData(
      isInVotingGracePeriod ? OffchainVotingGracePeriod : Process
    );
  }

  // Status: Ready to Submit Vote Result
  if (
    timeStartEndInitReady &&
    hasVotingEnded &&
    atSponsoredInDAO &&
    !offchainResultSubmitted
  ) {
    return getReturnData(OffchainVotingSubmitResult);
  }

  // Status: Grace period
  if (
    timeStartEndInitReady &&
    hasVotingEnded &&
    atSponsoredInDAO &&
    offchainResultSubmitted &&
    isInVotingGracePeriod
  ) {
    return getReturnData(OffchainVotingGracePeriod);
  }

  // Status: Process
  if (
    atSponsoredInDAO &&
    timeStartEndInitReady &&
    hasVotingEnded &&
    offchainResultSubmitted &&
    !isInVotingGracePeriod
  ) {
    return getReturnData(Process);
  }

  // Status: Processed (completed)
  if (atProcessedInDAO) {
    return getReturnData(Completed);
  }

  // Fallthrough
  return {
    daoProposal,
    daoProposalVote,
    daoProposalVoteResult,
    proposalFlowStatusError,
    status: undefined,
  };
}
