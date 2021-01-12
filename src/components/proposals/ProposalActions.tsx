import {useState, useEffect} from 'react';

import {FakeProposal} from './_mockData';
import SponsorAction from './SponsorAction';
import VotingAction from './VotingAction';

type ProposalActionsProps = {
  proposal: FakeProposal;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {proposal} = props;

  /**
   * Variables
   */

  // placeholder values to be able to render mockups with styles
  const votingStartSeconds = proposal.snapshotProposal.start;

  /**
   * State
   */

  const [hasVotingStarted, setHasVotingStarted] = useState<boolean>(
    Math.ceil(Date.now() / 1000) > votingStartSeconds
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

  /**
   * Render
   */

  return (
    <div className="proposaldetails__button-container">
      {/* SPONSOR BUTTON */}
      {/* @todo Show this action button if proposal still needs to be sponsored. Assumes voting starts upon sponsorship. There will probably be another data point to condition this on. */}
      {!hasVotingStarted && <SponsorAction />}

      {/* VOTING BUTTONS */}
      {/* @todo Show these action buttons if proposal has been sponsored. Assumes voting starts upon sponsorship. There will probably be another data point to condition this on. */}
      {hasVotingStarted && <VotingAction />}
    </div>
  );
}
