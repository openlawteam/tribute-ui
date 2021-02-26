import React from 'react';

import {SquareRootVotingBar} from '.';
import ProposalPeriod from '../ProposalPeriod';
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
  renderTimer: (component: typeof ProposalPeriod) => React.ReactNode;
  /**
   * Set to `false` to hide percentage data under the voting progress bar.
   * Defaults to `true`.
   */
  showPercentages?: boolean;
  noShares: Parameters<typeof SquareRootVotingBar>[0]['noShares'];
  totalShares: Parameters<typeof SquareRootVotingBar>[0]['totalShares'];
  yesShares: Parameters<typeof SquareRootVotingBar>[0]['yesShares'];
};

export function VotingStatus(props: VotingStatusProps) {
  const {
    hasVotingEnded,
    noShares,
    renderStatus,
    renderTimer,
    showPercentages = true,
    totalShares,
    yesShares,
  } = props;

  const renderedStatus = renderStatus();

  return (
    <>
      <div className="votingstatus-container">
        <StopwatchSVG aria-label="Counting down until voting ends" role="img" />

        {renderedStatus && (
          <span className="votingstatus">{renderedStatus}</span>
        )}

        {renderTimer(ProposalPeriod)}
      </div>

      {/* VOTES */}
      <SquareRootVotingBar
        yesShares={yesShares}
        noShares={noShares}
        totalShares={totalShares}
        votingExpired={hasVotingEnded}
        showPercentages={showPercentages}
      />
    </>
  );
}
