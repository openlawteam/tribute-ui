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
  stopPollingForStatus: () => void;
};

type UseProposalWithOffchainVoteStatusProps = {
  /**
   * Voting start time if `useCountdownToCheckInVoting: true`
   * i.e. calculated from the `OffchainVoting` contract's vote's start time, or Snapshot proposal's start time.
   *
   * If not available and/or determined, use `0`.
   */
  countdownVotingStartSeconds?: number;
  /**
   * Voting end time if `useCountdownToCheckInVoting: true`
   * i.e. calculated from the `OffchainVoting` contract's vote's end time, or Snapshot proposal's end time
   *
   * If not available and/or determined, use `0`.
   */
  countdownVotingEndSeconds?: number;
  proposal: ProposalData;
  /**
   * Defaults to `DEFAULT_POLL_INTERVAL_MS`:
   *  - Production: 15000ms
   *  - Development: 5000ms
   */
  pollInterval?: number;
  /**
   * If `true` "in voting" will be determined by an internal timer using
   * `countdownVotingStartSeconds` and `countdownVotingEndSeconds`, and not by the
   * contract's `VotingState`.
   */
  useCountdownToCheckInVoting?: boolean;
};

const {
  Completed,
  OffchainVotingGracePeriod,
  OffchainVotingSubmitResult,
  OffchainVoting,
  Process,
  Sponsor,
  Submit,
} = ProposalFlowStatus;

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
  countdownVotingEndSeconds = 0,
  countdownVotingStartSeconds = 0,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  proposal,
  useCountdownToCheckInVoting = false,
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

  const [status, setStatus] = useState<ProposalFlowStatus>();

  const [initComplete, setInitComplete] = useState<boolean>(false);

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
  } = useTimeStartEnd(countdownVotingStartSeconds, countdownVotingEndSeconds);

  /**
   * Variables
   */

  const initialAsyncChecksCompleted: boolean =
    initComplete &&
    (useCountdownToCheckInVoting ? timeStartEndInitReady : true);

  const {daoProposalVotingAdapter, snapshotDraft, snapshotProposal} = proposal;
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
    isAddress(daoProposalVote?.reporter || '') &&
    normalizeString(daoProposalVote?.reporter || '') !== BURN_ADDRESS;

  const isInVotingFromTimer: boolean = hasVotingStarted && !hasVotingEnded;

  const isInVoting: boolean = useCountdownToCheckInVoting
    ? isInVotingFromTimer
    : VotingState[daoProposalVoteResult || ''] ===
      VotingState[VotingState.IN_PROGRESS];

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
    if (initComplete) {
      return;
    }

    getStatusFromContractCached().catch((error) => {
      setProposalFlowStatusError(error);
    });
  }, [getStatusFromContractCached, initComplete]);

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
    handleStopPollingForStatus();

    // Then, poll every `x` Ms
    const intervalId = setInterval(async () => {
      try {
        if (stopPollingRef.current) {
          handleStopPollingForStatus();
        }

        await getStatusFromContractCached();
      } catch (error) {
        handleStopPollingForStatus();

        setProposalFlowStatusError(error);
      }
    }, pollInterval);

    pollingIntervalIdRef.current = intervalId;
  }, [atProcessedInDAO, pollInterval, getStatusFromContractCached]);

  // Stop polling if propsal is processed, or on unmount.
  useEffect(() => {
    if (atProcessedInDAO) {
      handleStopPollingForStatus();
    }

    // Cleanup polling on unmount
    return function cleanup() {
      handleStopPollingForStatus();
    };
  }, [atProcessedInDAO]);

  // Determine the `status`
  useEffect(() => {
    // Status: cannot yet be determined
    if (!initialAsyncChecksCompleted) {
      setStatus(undefined);

      return;
    }

    const isStatusInitial: boolean = status === undefined;

    // Status: Submit
    if (
      !atExistsInDAO &&
      !atSponsoredInDAO &&
      !atProcessedInDAO &&
      (status === Submit || isStatusInitial)
    ) {
      setStatus(Submit);

      return;
    }

    /**
     * Status: Sponsor
     *
     * This may never occur for many adapter's proposals as submit and sponsor
     * take place in 1 transaction.
     */
    if (
      atExistsInDAO &&
      !isInVoting &&
      (status === Submit || isStatusInitial)
    ) {
      setStatus(Sponsor);

      return;
    }

    // Status: Off-Chain Voting
    if (
      atSponsoredInDAO &&
      isInVoting &&
      !offchainResultSubmitted &&
      (status === Submit || status === Sponsor || isStatusInitial)
    ) {
      setStatus(OffchainVoting);

      return;
    }

    // Status: Ready to Submit Vote Result
    if (
      atSponsoredInDAO &&
      !isInVoting &&
      !offchainResultSubmitted &&
      (status === OffchainVoting || isStatusInitial)
    ) {
      setStatus(OffchainVotingSubmitResult);

      return;
    }

    // Status: Grace period
    if (
      atSponsoredInDAO &&
      !isInVoting &&
      offchainResultSubmitted &&
      isInVotingGracePeriod &&
      (status === OffchainVotingSubmitResult || isStatusInitial)
    ) {
      setStatus(OffchainVotingGracePeriod);

      return;
    }

    // Status: Process
    if (
      atSponsoredInDAO &&
      !isInVoting &&
      offchainResultSubmitted &&
      !isInVotingGracePeriod &&
      (status === OffchainVotingGracePeriod || isStatusInitial)
    ) {
      setStatus(Process);

      return;
    }

    // Status: Processed (completed)
    if (atProcessedInDAO && (status === Process || isStatusInitial)) {
      setStatus(Completed);

      return;
    }
  }, [
    atExistsInDAO,
    atProcessedInDAO,
    atSponsoredInDAO,
    initialAsyncChecksCompleted,
    isInVoting,
    isInVotingGracePeriod,
    offchainResultSubmitted,
    status,
  ]);

  /**
   * Functions
   */

  async function getStatusFromContract(): Promise<
    | Partial<{
        proposal: typeof daoProposal;
        voteResult: typeof daoProposalVoteResult;
        votes: typeof daoProposalVote;
      }>
    | undefined
  > {
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
        // Set last
        setInitComplete(true);

        return proposal;
      }

      if (!offchainVotingABI || !offchainVotingAddress) return;

      const voteResultABI = offchainVotingABI.filter(
        (item) => item.name === 'voteResult'
      )[0];

      const voteABI = offchainVotingABI.filter(
        (item) => item.name === 'getVote'
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

      const votesToSet = {
        snapshot: votes[0],
        reporter: votes[1],
        resultRoot: votes[2],
        nbYes: votes[3],
        nbNo: votes[4],
        startingTime: votes[5],
        gracePeriodStartingTime: votes[6],
        isChallenged: votes[7],
        stepRequested: votes[8],
        forceFailed: votes[9],
        fallbackVotesCount: votes[10],
      };

      setDAOProposal(proposal);
      setDAOProposalVote(votesToSet);
      setDAOProposalVoteResult(voteResult);
      // Set last
      setInitComplete(true);

      return {
        proposal,
        voteResult,
        votes,
      };
    } catch (error) {
      throw error;
    }
  }

  function handleStopPollingForStatus() {
    if (pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);

      pollingIntervalIdRef.current = undefined;
    }
  }

  /**
   * Return
   */

  return {
    daoProposal,
    daoProposalVote,
    daoProposalVoteResult,
    proposalFlowStatusError,
    status,
    stopPollingForStatus: handleStopPollingForStatus,
  };
}
