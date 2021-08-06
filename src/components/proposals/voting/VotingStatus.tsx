import React from 'react';

import {SquareRootVotingBar} from '.';
import ProposalPeriodCountdown from '../ProposalPeriodCountdown';
import StopwatchSVG from '../../../assets/svg/StopwatchSVG';

type VotingStatusProps = {
  hasVotingEnded: boolean;
  /**
   * A render prop to display status to before / after the clock timer is shown.
   */
  renderStatus: () => React.ReactNode;
  /**
   * A render prop: display the `ProposalPeriod` timer.
   * `renderTimer` Provides `ProposalPeriod` component as an argument.
   *
   * Passing the `ProposalPeriod` component via the render prop
   * gives the opportunity to easily show a timer for voting, or grace period, for example,
   * without adding more props.
   */
  renderTimer: (component: typeof ProposalPeriodCountdown) => React.ReactNode;
  /**
   * Set to `false` to hide percentage data under the voting progress bar.
   * Defaults to `true`.
   */
  showPercentages?: boolean;
  noUnits: Parameters<typeof SquareRootVotingBar>[0]['noUnits'];
  totalUnits: Parameters<typeof SquareRootVotingBar>[0]['totalUnits'];
  yesUnits: Parameters<typeof SquareRootVotingBar>[0]['yesUnits'];
};

export function VotingStatus(props: VotingStatusProps) {
  const {
    hasVotingEnded,
    noUnits,
    renderStatus,
    renderTimer,
    showPercentages = true,
    totalUnits,
    yesUnits,
  } = props;

  const renderedStatus = renderStatus();

  return (
    <>
      <div className="votingstatus-container">
        <StopwatchSVG aria-label="Proposal status" role="img" />

        {renderedStatus && (
          <span className="votingstatus">{renderedStatus}</span>
        )}

        {renderTimer(ProposalPeriodCountdown)}
      </div>

      {/* VOTES */}
      <SquareRootVotingBar
        yesUnits={yesUnits}
        noUnits={noUnits}
        totalUnits={totalUnits}
        votingExpired={hasVotingEnded}
        showPercentages={showPercentages}
      />
    </>
  );
}
