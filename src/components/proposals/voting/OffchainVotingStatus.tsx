import {CycleEllipsis} from '../../feedback';
import {ProposalData, VotingResult} from '../types';
import {useOffchainVotingResults} from '../hooks';
import {useTimeStartEnd} from '../../../hooks';
import {VotingStatus} from './VotingStatus';

export type OffchainVotingStatusRenderStatusProps = {
  countdownGracePeriodEndMs: OffchainVotingStatusProps['countdownGracePeriodEndMs'];
  countdownGracePeriodStartMs: OffchainVotingStatusProps['countdownGracePeriodStartMs'];
  countdownVotingEndMs: OffchainVotingStatusProps['countdownVotingEndMs'];
  countdownVotingStartMs: OffchainVotingStatusProps['countdownVotingStartMs'];
  didVotePass: boolean | undefined;
  gracePeriodStartEndInitReady: boolean;
  hasGracePeriodEnded: boolean;
  hasGracePeriodStarted: boolean;
  hasVotingEnded: boolean;
  hasVotingStarted: boolean;
  votingStartEndInitReady: boolean;
};

type OffchainVotingStatusProps = {
  /**
   * Will override the default Snapshot proposal's voting `start` time
   */
  countdownVotingStartMs?: number;
  /**
   * Will override the default Snapshot proposal's voting `end` time
   */
  countdownVotingEndMs?: number;
  /**
   * When the offchain grace period start seconds are provided the grace period timer
   * will display.
   *
   * Be sure to unset this value (`0`, `undefined`) if the grace period should not show.
   */
  countdownGracePeriodStartMs?: number;
  countdownGracePeriodEndMs?: number;
  proposal: ProposalData;
  renderStatus?: (p: OffchainVotingStatusRenderStatusProps) => React.ReactNode;
  /**
   * If a fetched `VotingResult` is provided
   * it will save the need to fetch inside of this component.
   *
   * e.g. Governance proposals listing may fetch all voting results
   *   in order to filter the `ProposalCard`s and be able to provide the results.
   */
  votingResult?: VotingResult;
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
  proposal,
  renderStatus,
  votingResult,
}: OffchainVotingStatusProps): JSX.Element {
  const {snapshotProposal} = proposal;

  const votingStartSecondsToUse: number | undefined = countdownVotingStartMs
    ? countdownVotingStartMs / 1000
    : snapshotProposal?.msg.payload.start;

  const votingEndSecondsToUse: number | undefined = countdownVotingEndMs
    ? countdownVotingEndMs / 1000
    : snapshotProposal?.msg.payload.end;

  const gracePeriodStartToSeconds: number | undefined =
    countdownGracePeriodStartMs
      ? countdownGracePeriodStartMs / 1000
      : undefined;

  const gracePeriodEndToSeconds: number | undefined = countdownGracePeriodEndMs
    ? countdownGracePeriodEndMs / 1000
    : undefined;

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

  const {offchainVotingResults} = useOffchainVotingResults(
    votingResult ? undefined : snapshotProposal
  );

  /**
   * Variables
   */

  // There is only one vote result entry as we only passed a single proposal
  const votingResultToUse: VotingResult = votingResult
    ? votingResult
    : offchainVotingResults[0]?.[1];

  const isGracePeriodActive: boolean =
    gracePeriodStartEndInitReady &&
    hasGracePeriodStarted &&
    !hasGracePeriodEnded;

  const noUnits: number = votingResultToUse?.No.units || 0;
  const totalUnits: number = votingResultToUse?.totalUnits;
  const votingEndMs: number = (votingEndSecondsToUse || 0) * 1000;
  const votingStartMs: number = (votingStartSecondsToUse || 0) * 1000;
  const yesUnits: number = votingResultToUse?.Yes.units || 0;
  // We use `undefined` to indicate that the result has not yet been determined.
  const didVotePass: boolean | undefined = hasVotingEnded
    ? yesUnits > noUnits
    : undefined;

  const renderedStatusFromProp = renderStatus?.({
    countdownGracePeriodEndMs,
    countdownGracePeriodStartMs,
    countdownVotingEndMs: votingEndMs,
    countdownVotingStartMs: votingStartMs,
    didVotePass,
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

    // Default: loading
    if (!votingStartEndInitReady) {
      return (
        <CycleEllipsis
          ariaLabel="Getting off-chain voting status"
          fadeInProps={cycleEllipsisFadeInProps}
          intervalMs={200}
        />
      );
    }

    // Default: If in grace period, do not show a label, as we will provide it to `ProposalPeriodComponent`.
    if (isGracePeriodActive) {
      return '';
    }

    // Default: On voting period and grace period ended
    if (hasVotingEnded) {
      return yesUnits > noUnits ? 'Approved' : 'Failed';
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
