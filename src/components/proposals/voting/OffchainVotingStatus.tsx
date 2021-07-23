import {CycleEllipsis} from '../../feedback';
import {useTimeStartEnd} from '../../../hooks';
import {VotingResult} from '../types';
import {VotingStatus} from './VotingStatus';

export type OffchainVotingStatusRenderStatusProps = {
  countdownGracePeriodEndMs: OffchainVotingStatusProps['countdownGracePeriodEndMs'];
  countdownGracePeriodStartMs: OffchainVotingStatusProps['countdownGracePeriodStartMs'];
  countdownVotingEndMs: OffchainVotingStatusProps['countdownVotingEndMs'];
  countdownVotingStartMs: OffchainVotingStatusProps['countdownVotingStartMs'];
  didVotePassSimpleMajority: boolean | undefined;
  gracePeriodStartEndInitReady: boolean;
  hasGracePeriodEnded: boolean;
  hasGracePeriodStarted: boolean;
  hasVotingEnded: boolean;
  hasVotingStarted: boolean;
  votingStartEndInitReady: boolean;
};

type OffchainVotingStatusProps = {
  /**
   * Voting start time
   * i.e. calculated from the `OffchainVoting` contract's vote's start time, or Snapshot proposal's start time
   */
  countdownVotingStartMs: number | undefined;
  /**
   * Voting end time
   * i.e. calculated from the `OffchainVoting` contract's vote's end time, or Snapshot proposal's end time
   */
  countdownVotingEndMs: number | undefined;
  /**
   * Grace period start time
   * i.e. calculated from the `OffchainVoting` contract's vote's start time, or Snapshot proposal's start time
   */
  countdownGracePeriodStartMs?: number;
  /**
   * Grace period end time
   * i.e. calculated from the `OffchainVoting` contract's vote's end time, or Snapshot proposal's end time
   */
  countdownGracePeriodEndMs?: number;
  renderStatus?: (p: OffchainVotingStatusRenderStatusProps) => React.ReactNode;
  /**
   * A single proposal's `VotingResult` (i.e. as provided by `useOffchainVotingResults`)
   */
  votingResult: VotingResult | undefined;
};

// Grace period label
const gracePeriodEndLabel = (
  <span>
    Grace period ends:
    <br />
  </span>
);

const cycleEllipsisFadeInProps = {duration: 150};

/**
 * OffchainVotingStatus
 *
 * A read-only component to show voting status information.
 *
 * @param {OffchainVotingStatusProps} props
 * @returns {JSX.Element}
 */
export function OffchainVotingStatus({
  countdownGracePeriodEndMs,
  countdownGracePeriodStartMs,
  countdownVotingEndMs,
  countdownVotingStartMs,
  renderStatus,
  votingResult,
}: OffchainVotingStatusProps): JSX.Element {
  const votingStartSecondsToUse: number = countdownVotingStartMs
    ? countdownVotingStartMs / 1000
    : 0;

  const votingEndSecondsToUse: number = countdownVotingEndMs
    ? countdownVotingEndMs / 1000
    : 0;

  const gracePeriodStartToSeconds: number = countdownGracePeriodStartMs
    ? countdownGracePeriodStartMs / 1000
    : 0;

  const gracePeriodEndToSeconds: number = countdownGracePeriodEndMs
    ? countdownGracePeriodEndMs / 1000
    : 0;

  /**
   * Our hooks
   */

  const {
    hasTimeEnded: hasVotingEnded,
    hasTimeStarted: hasVotingStarted,
    timeStartEndInitReady: votingStartEndInitReady,
  } = useTimeStartEnd(votingStartSecondsToUse, votingEndSecondsToUse);

  const {
    hasTimeEnded: hasGracePeriodEnded,
    hasTimeStarted: hasGracePeriodStarted,
    timeStartEndInitReady: gracePeriodStartEndInitReady,
  } = useTimeStartEnd(gracePeriodStartToSeconds, gracePeriodEndToSeconds);

  /**
   * Variables
   */

  const isGracePeriodActive: boolean =
    gracePeriodStartEndInitReady &&
    hasGracePeriodStarted &&
    !hasGracePeriodEnded;

  const noUnits: number = votingResult?.No.units || 0;
  const totalUnits: number = votingResult?.totalUnits || 0;
  const votingEndMs: number = (votingEndSecondsToUse || 0) * 1000;
  const votingStartMs: number = (votingStartSecondsToUse || 0) * 1000;
  const yesUnits: number = votingResult?.Yes.units || 0;

  // We use `undefined` to indicate that the result has not yet been determined.
  const didVotePassSimpleMajority: boolean | undefined = hasVotingEnded
    ? yesUnits > noUnits
    : undefined;

  const renderedStatusFromProp = renderStatus?.({
    countdownGracePeriodEndMs,
    countdownGracePeriodStartMs,
    countdownVotingEndMs: votingEndMs,
    countdownVotingStartMs: votingStartMs,
    didVotePassSimpleMajority,
    gracePeriodStartEndInitReady,
    hasGracePeriodEnded,
    hasGracePeriodStarted,
    hasVotingEnded,
    hasVotingStarted,
    votingStartEndInitReady,
  });

  /**
   * Functions
   */

  function renderOffchainVotingStatus(): React.ReactNode {
    // Render status from prop
    if (renderedStatusFromProp) {
      return renderedStatusFromProp;
    }

    // Loading
    if (!votingStartEndInitReady) {
      return (
        <CycleEllipsis
          ariaLabel="Getting off-chain voting status"
          fadeInProps={cycleEllipsisFadeInProps}
          intervalMs={200}
        />
      );
    }

    // If in grace period, do not show a status.
    if (isGracePeriodActive) {
      return '';
    }

    // If passed on voting period ended
    if (didVotePassSimpleMajority) {
      return 'Approved';
    }

    // If failed on voting period ended
    if (didVotePassSimpleMajority === false) {
      return 'Failed';
    }
  }

  function renderTimer(
    ProposalPeriodComponent: Parameters<
      Parameters<typeof VotingStatus>[0]['renderTimer']
    >[0]
  ): React.ReactNode {
    // Vote countdown timer
    if (votingStartEndInitReady && hasVotingStarted && !hasVotingEnded) {
      return (
        <ProposalPeriodComponent
          endPeriodMs={votingEndMs}
          startPeriodMs={votingStartMs}
        />
      );
    }

    // Grace period countdown timer
    if (isGracePeriodActive) {
      return (
        <ProposalPeriodComponent
          endLabel={gracePeriodEndLabel}
          endPeriodMs={countdownGracePeriodEndMs || 0}
          startPeriodMs={countdownGracePeriodStartMs || 0}
        />
      );
    }
  }

  /**
   * Render
   */

  return (
    <VotingStatus
      hasVotingEnded={hasVotingEnded}
      noUnits={noUnits}
      renderStatus={renderOffchainVotingStatus}
      renderTimer={renderTimer}
      totalUnits={totalUnits}
      yesUnits={yesUnits}
    />
  );
}
