import {useEffect} from 'react';

import {CycleEllipsis} from '../../feedback';
import {RenderCountdownTextProps} from '../ProposalPeriodCountdown';
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

export type OnGracePeriodChangeProps = {
  hasGracePeriodEnded: boolean;
  hasGracePeriodStarted: boolean;
  /**
   * Helpful if responding to events for multiple proposals
   */
  proposalId?: string;
  gracePeriodStartEndInitReady: boolean;
};

export type OnVotingPeriodChangeProps = {
  hasVotingEnded: boolean;
  hasVotingStarted: boolean;
  /**
   * Helpful if responding to events for multiple proposals
   */
  proposalId?: string;
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
  /**
   * An optional callback to run on grace period time changes
   */
  onGracePeriodChange?: (p: OnGracePeriodChangeProps) => void;
  /**
   * An optional callback to run on voting time changes
   */
  onVotingPeriodChange?: (p: OnVotingPeriodChangeProps) => void;
  /**
   * An optional proposal ID if working with multiple proposals (i.e. listing).
   * Helps when repsonding to events from callbacks like `onVotingPeriodChange` and `onGracePeriodChange`.
   */
  proposalId?: string;
  /**
   * Render a custom status
   */
  renderStatus?: (p: OffchainVotingStatusRenderStatusProps) => React.ReactNode;
  /**
   * A single proposal's `VotingResult` (i.e. as provided by `useOffchainVotingResults`)
   */
  votingResult: VotingResult | undefined;
};

function renderCountdownText({
  days,
  hours,
  formatTimePeriod: format,
}: RenderCountdownTextProps) {
  if (days > 0) {
    return `${format(days, 'day')} : ${format(hours, 'hr')}`;
  }
}

// Grace period label
const gracePeriodLabel = <span>Grace period:</span>;

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
  countdownGracePeriodEndMs = 0,
  countdownGracePeriodStartMs = 0,
  countdownVotingEndMs = 0,
  countdownVotingStartMs = 0,
  onGracePeriodChange,
  onVotingPeriodChange,
  proposalId,
  renderStatus,
  votingResult,
}: OffchainVotingStatusProps): JSX.Element {
  /**
   * Our hooks
   */

  const {
    hasTimeEnded: hasVotingEnded,
    hasTimeStarted: hasVotingStarted,
    timeStartEndInitReady: votingStartEndInitReady,
  } = useTimeStartEnd(
    countdownVotingStartMs / 1000,
    countdownVotingEndMs / 1000
  );

  const {
    hasTimeEnded: hasGracePeriodEnded,
    hasTimeStarted: hasGracePeriodStarted,
    timeStartEndInitReady: gracePeriodStartEndInitReady,
  } = useTimeStartEnd(
    countdownGracePeriodStartMs / 1000,
    countdownGracePeriodEndMs / 1000
  );

  /**
   * Variables
   */

  const isGracePeriodActive: boolean =
    gracePeriodStartEndInitReady &&
    hasGracePeriodStarted &&
    !hasGracePeriodEnded;

  const noUnits: number = votingResult?.No.units || 0;
  const totalUnits: number = votingResult?.totalUnits || 0;
  const yesUnits: number = votingResult?.Yes.units || 0;

  // We use `undefined` to indicate that the result has not yet been determined.
  const didVotePassSimpleMajority: boolean | undefined = hasVotingEnded
    ? yesUnits > noUnits
    : undefined;

  const renderedStatusFromProp = renderStatus?.({
    countdownGracePeriodEndMs,
    countdownGracePeriodStartMs,
    countdownVotingEndMs,
    countdownVotingStartMs,
    didVotePassSimpleMajority,
    gracePeriodStartEndInitReady,
    hasGracePeriodEnded,
    hasGracePeriodStarted,
    hasVotingEnded,
    hasVotingStarted,
    votingStartEndInitReady,
  });

  /**
   * Effects
   */

  // When voting times are updated, call the `onVotingPeriodChange` callback
  useEffect(() => {
    if (!votingStartEndInitReady) return;

    onVotingPeriodChange?.({
      hasVotingStarted,
      hasVotingEnded,
      proposalId,
      votingStartEndInitReady,
    });
  }, [
    hasVotingEnded,
    hasVotingStarted,
    onVotingPeriodChange,
    proposalId,
    votingStartEndInitReady,
  ]);

  // When voting times are updated, call the `onGracePeriodChange` callback
  useEffect(() => {
    if (!gracePeriodStartEndInitReady) return;

    onGracePeriodChange?.({
      hasGracePeriodEnded,
      hasGracePeriodStarted,
      proposalId,
      gracePeriodStartEndInitReady,
    });
  }, [
    gracePeriodStartEndInitReady,
    hasGracePeriodEnded,
    hasGracePeriodStarted,
    onGracePeriodChange,
    proposalId,
  ]);

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
          endPeriodMs={countdownVotingEndMs}
          renderCountdownText={renderCountdownText}
          startPeriodMs={countdownVotingStartMs}
        />
      );
    }

    // Grace period countdown timer
    if (isGracePeriodActive) {
      return (
        <ProposalPeriodComponent
          endLabel={gracePeriodLabel}
          endPeriodMs={countdownGracePeriodEndMs || 0}
          renderCountdownText={renderCountdownText}
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
