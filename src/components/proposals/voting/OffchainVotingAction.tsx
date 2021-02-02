import React from 'react';

import {ProposalData} from '../types';
import {useVotingStartEnd} from '../hooks';
import {VotingActionButtons} from '.';

type OffchainVotingActionProps = {
  proposal: ProposalData;
};

/**
 * OffchainVotingAction
 *
 * An off-chain voting action component which facilitates submitting to Snapshot Hub.
 *
 * @returns {JSX.Element}
 */
export function OffchainVotingAction(
  props: OffchainVotingActionProps
): React.ReactNode {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {hasVotingEnded, votingStartEndInitReady} = useVotingStartEnd(proposal);

  /**
   * Render
   */

  if (!votingStartEndInitReady || hasVotingEnded) {
    return null;
  }

  return (
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
  );
}
