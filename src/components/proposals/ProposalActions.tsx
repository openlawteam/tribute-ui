import React from 'react';

import {OffchainVotingStatus, OffchainVotingAction} from './voting';
import {ProposalData} from './types';
import {useVotingStartEnd} from './hooks/useVotingStartEnd';
import SponsorAction from './SponsorAction';
import {ContractAdapterNames} from '../web3/types';

type ProposalActionsProps = {
  adpaterName: ContractAdapterNames;
  proposal: ProposalData;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {adpaterName, proposal} = props;

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
          <OffchainVotingAction adapterName={adpaterName} proposal={proposal} />
        </>
      )}
    </div>
  );
}
