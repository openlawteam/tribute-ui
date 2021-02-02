import React from 'react';

import {OffchainVotingStatus} from './voting';
import {ProposalData} from './types';
import {useVotingStartEnd} from './hooks/useVotingStartEnd';
import {VotingActionButtons} from './voting';
import SponsorAction from './SponsorAction';

type ProposalActionsProps = {
  proposal: ProposalData;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {
    hasVotingStarted,
    hasVotingEnded,
    votingStartEndInitReady,
  } = useVotingStartEnd(proposal);

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
          {/* VOTING PROGRESS STATUS AND BAR */}
          <OffchainVotingStatus proposal={proposal} />
          {/* VOTING ACTIONS */}
          {!hasVotingEnded && (
            <VotingActionButtons
              onClick={console.log}
              buttonProps={
                {
                  // disabled: true,
                  // 'aria-disabled': true,
                }
              }
              // voteChosen={}
              // voteProgress={}
            />
          )}
        </>
      )}
    </div>
  );
}
