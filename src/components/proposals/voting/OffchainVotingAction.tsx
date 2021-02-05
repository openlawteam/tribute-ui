import React from 'react';

import {ContractAdapterNames} from '../../web3/types';
import {ProposalData} from '../types';
import {useSignAndSendVote, useVotingStartEnd} from '../hooks';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import {VotingActionButtons} from '.';

type OffchainVotingActionProps = {
  adapterName: ContractAdapterNames;
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
): JSX.Element | null {
  const {adapterName, proposal} = props;

  /**
   * Our hooks
   */

  const {hasVotingEnded, votingStartEndInitReady} = useVotingStartEnd(proposal);
  const {signAndSendVote} = useSignAndSendVote();

  /**
   * Variables
   */

  const proposalHash: string = proposal.snapshotProposal?.idInSnapshot || '';

  /**
   * Render
   */

  if (!votingStartEndInitReady || hasVotingEnded) {
    return null;
  }

  /**
   * Functions
   */

  async function handleSubmitVote(choice: VoteChoices) {
    if (!proposalHash) {
      // @todo set error
      return;
    }

    // 1. Sign and submit to Snapshot Hub
    const {signature} = await signAndSendVote(
      {choice},
      adapterName,
      proposalHash
    );

    console.log('signature', signature);
  }

  return (
    <VotingActionButtons
      onClick={handleSubmitVote}
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
