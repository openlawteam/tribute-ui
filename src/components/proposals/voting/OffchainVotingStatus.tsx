import {useEffect, useState} from 'react';

import {ProposalData} from '../types';
import {SquareRootVotingBar} from '.';
import {useVotingStartEnd} from '../hooks';
import ProposalPeriod from '../ProposalPeriod';
import StopwatchSVG from '../../../assets/svg/StopwatchSVG';

type OffchainVotingStatusProps = {
  proposal: ProposalData;
  showPercentages?: boolean;
};

/**
 * OffchainVotingStatus
 *
 * A read-only component to show voting status information.
 *
 * @param {OffchainVotingStatusProps} props
 * @returns {JSX.Element}
 */
export function OffchainVotingStatus({
  proposal,
  showPercentages = true,
}: OffchainVotingStatusProps): JSX.Element {
  const {snapshotProposal} = proposal;

  /**
   * State
   */

  const [didVotePass, setDidVotePass] = useState<boolean>();

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
   * Effects
   */

  useEffect(() => {
    if (!hasVotingEnded) return;

    setDidVotePass(yesShares > noShares);
  }, [hasVotingEnded]);

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
        {typeof didVotePass === 'boolean' && (
          <span className="votingstatus">
            {didVotePass ? 'Approved' : 'Failed'}
          </span>
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
