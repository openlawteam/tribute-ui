import {useState, useEffect} from 'react';

import ProposalPeriod from './ProposalPeriod';
import SquareRootVotingBar from './SquareRootVotingBar';

import StopwatchSVG from '../../assets/svg/StopwatchSVG';

type VotingStatusProps = {
  snapshotProposal: any; // placeholder prop
};

export default function VotingStatus(props: VotingStatusProps) {
  /**
   * Variables
   */

  // placeholders values to be able to render styles
  const {snapshotProposal} = props;
  const votingStartSeconds = snapshotProposal.start;
  const votingEndSeconds = snapshotProposal.end;
  const yesShares = snapshotProposal.yesShares;
  const noShares = snapshotProposal.noShares;
  const totalShares = 10000000;

  /**
   * State
   */

  const [hasVotingEnded, setHasVotingEnded] = useState<boolean>(
    Math.ceil(Date.now() / 1000) > votingEndSeconds
  );

  /**
   * Effects
   */

  // Actively check if voting has ended
  useEffect(() => {
    // If the value is already `true`, then exit.
    if (hasVotingEnded) return;

    // Check if voting has ended every 1 second
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

        {/* CLOCK WHILE IN VOTING */}
        {!hasVotingEnded && (
          <ProposalPeriod
            startPeriod={new Date(votingStartSeconds * 1000)}
            endPeriod={new Date(votingEndSeconds * 1000)}
          />
        )}

        {/* STATUS WHEN NOT SPONSORED */}
        {/* <span className="votingstatus">Pending Sponsor</span> */}

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
        showPercentages={false}
      />
    </>
  );
}
