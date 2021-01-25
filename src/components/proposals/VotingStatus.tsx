import {useState, useEffect} from 'react';

import ProposalPeriod from './ProposalPeriod';
import SquareRootVotingBar from './SquareRootVotingBar';

import StopwatchSVG from '../../assets/svg/StopwatchSVG';
import {ProposalCombined} from './types';
import {SnapshotProposalResponseData} from '@openlaw/snapshot-js-erc712';

type VotingStatusProps = {
  proposal: ProposalCombined<SnapshotProposalResponseData>;
  showPercentages?: boolean;
};

export default function VotingStatus({
  proposal,
  showPercentages = true,
}: VotingStatusProps) {
  /**
   * Variables
   */

  // placeholder values to be able to render mockups with styles
  const votingStartSeconds = proposal.snapshotProposal.msg.payload.start;
  const votingEndSeconds = proposal.snapshotProposal.msg.payload.end;
  // @todo Add function to calculate member voting power by shares
  const yesShares = 0;
  const noShares = 0;
  const totalShares = 10000000;

  /**
   * State
   */

  const [hasVotingStarted, setHasVotingStarted] = useState<boolean>(
    Math.ceil(Date.now() / 1000) > votingStartSeconds
  );
  const [hasVotingEnded, setHasVotingEnded] = useState<boolean>(
    Math.ceil(Date.now() / 1000) > votingEndSeconds
  );

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    // If the value is already `true`, then exit.
    if (hasVotingStarted) return;

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      const hasStartedCheck = Math.ceil(Date.now() / 1000) > votingStartSeconds;

      if (!hasStartedCheck) return;

      setHasVotingStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [hasVotingStarted, votingStartSeconds]);

  // Actively check if voting has ended
  useEffect(() => {
    // If the value is already `true`, then exit.
    if (hasVotingEnded) return;

    // Check if voting has started/ended every 1 second
    const intervalID = setInterval(() => {
      const hasEndedCheck = Math.ceil(Date.now() / 1000) > votingEndSeconds;

      if (!hasEndedCheck) return;

      setHasVotingEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [hasVotingEnded, votingEndSeconds]);

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
        {/* STATUS WHEN NOT SPONSORED */}
        {/* @todo Assumes voting starts upon sponsorship. There will probably be another data point to condition this on. */}
        {!hasVotingStarted && (
          <span className="votingstatus">Pending Sponsor</span>
        )}
        {/* CLOCK WHILE IN VOTING */}
        {hasVotingStarted && !hasVotingEnded && (
          <ProposalPeriod
            startPeriod={new Date(votingStartSeconds * 1000)}
            endPeriod={new Date(votingEndSeconds * 1000)}
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
