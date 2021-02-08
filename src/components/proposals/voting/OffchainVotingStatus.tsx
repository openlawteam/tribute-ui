import {useEffect, useState} from 'react';

import {ProposalData} from '../types';
import {SquareRootVotingBar} from '.';
import {useOffchainVotingStartEnd} from '../hooks';
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
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  /**
   * Effects
   */

  useEffect(() => {
    if (!hasOffchainVotingEnded) return;

    setDidVotePass(yesShares > noShares);
  }, [hasOffchainVotingEnded]);

  /**
   * Render
   */

  return (
    <>
      <div className="votingstatus-container">
        <StopwatchSVG />

        {!offchainVotingStartEndInitReady && (
          <span className="votingstatus">&hellip;</span>
        )}

        {/* STATUS WHEN NOT SPONSORED */}
        {offchainVotingStartEndInitReady && !hasOffchainVotingStarted && (
          <span className="votingstatus">Pending Sponsor</span>
        )}

        {/* CLOCK WHILE IN VOTING */}
        {offchainVotingStartEndInitReady &&
          hasOffchainVotingStarted &&
          !hasOffchainVotingEnded && (
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
        votingExpired={hasOffchainVotingEnded}
        showPercentages={showPercentages}
      />
    </>
  );
}
