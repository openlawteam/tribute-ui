import React from 'react';

import {OffchainVotingStatus, OffchainVotingAction} from './voting';
import {ProposalData} from './types';
import {useVotingStartEnd} from './hooks/useVotingStartEnd';
import SponsorAction from './SponsorAction';

type ProposalActionsProps = {
  proposal: ProposalData;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {hasVotingStarted, votingStartEndInitReady} = useVotingStartEnd(
    proposal
  );

  /**
   * Render
   */

  return (
    <div className="proposaldetails__button-container">
      {/* SPONSOR BUTTON */}
      {votingStartEndInitReady && !hasVotingStarted && (
        <SponsorAction proposal={proposal} />
      )}

      {votingStartEndInitReady && hasVotingStarted && (
        <>
          <OffchainVotingStatus proposal={proposal} />
          <OffchainVotingAction proposal={proposal} />
        </>
      )}
    </div>
  );
}
