import React from 'react';

import {ProposalData} from './types';
import {useVotingStartEnd} from './hooks/useVotingStartEnd';
import SponsorAction from './SponsorAction';
import VotingAction from './VotingAction';
import VotingStatus from './VotingStatus';

type ProposalActionsProps = {
  proposal: ProposalData;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {hasVotingStarted, hasVotingEnded} = useVotingStartEnd(proposal);

  /**
   * Render
   */

  return (
    <div className="proposaldetails__button-container">
      {/* SPONSOR BUTTON */}
      {!hasVotingStarted && <SponsorAction proposal={proposal} />}

      {hasVotingStarted && (
        <>
          {/* VOTING PROGRESS STATUS AND BAR */}
          <VotingStatus proposal={proposal} />
          {/* VOTING ACTIONS */}
          {!hasVotingEnded && <VotingAction />}
        </>
      )}
    </div>
  );
}
