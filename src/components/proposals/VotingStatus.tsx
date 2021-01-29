import {ProposalData} from './types';
import {useVotingStartEnd} from './hooks';
import ProposalPeriod from './ProposalPeriod';
import SquareRootVotingBar from './SquareRootVotingBar';
import StopwatchSVG from '../../assets/svg/StopwatchSVG';

type VotingStatusProps = {
  proposal: ProposalData;
  showPercentages?: boolean;
};

/**
 * VotingStatus
 *
 * A read-only component to show voting status information.
 *
 * @param {VotingStatusProps} props
 * @returns {JSX.Element}
 */
export default function VotingStatus({
  proposal,
  showPercentages = true,
}: VotingStatusProps): JSX.Element {
  const {snapshotProposal} = proposal;

  /**
   * Variables
   */

  // placeholder values to be able to render mockups with styles
  const votingStartSeconds = snapshotProposal?.msg.payload.start || 0;
  const votingEndSeconds = snapshotProposal?.msg.payload.end || 0;
  // @todo Add function to calculate member voting power by shares
  const yesShares = 0;
  const noShares = 0;
  const totalShares = 10000000;

  /**
   * Our hooks
   */

  const {
    hasVotingStarted,
    hasVotingEnded,
    votingStartEndInitReady,
  } = useVotingStartEnd(proposal);

  /**
   * Functions
   */

  function getDidVotePass(): boolean | undefined {
    if (!hasVotingEnded) return;

    const yesGreaterThanNo = yesShares > noShares;

    return yesGreaterThanNo;
  }

  /**
   * Render
   */

  return (
    <>
      <div className="votingstatus-container">
        <StopwatchSVG />

        {!votingStartEndInitReady && (
          <span className="votingstatus">&hellip;</span>
        )}

        {/* STATUS WHEN NOT SPONSORED */}
        {votingStartEndInitReady && !hasVotingStarted && (
          <span className="votingstatus">Pending Sponsor</span>
        )}

        {/* CLOCK WHILE IN VOTING */}
        {votingStartEndInitReady && hasVotingStarted && !hasVotingEnded && (
          <ProposalPeriod
            startPeriodMs={votingStartSeconds * 1000}
            endPeriodMs={votingEndSeconds * 1000}
          />
        )}

        {/* STATUSES ON VOTING ENDED */}
        {getDidVotePass() && <span className="votingstatus">Approved</span>}
        {getDidVotePass() === false && (
          <span className="votingstatus">Failed</span>
        )}
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
