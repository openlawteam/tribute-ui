import React from 'react';

import {ContractAdapterNames} from '../web3/types';
import {OffchainVotingStatus, OffchainVotingAction} from './voting';
import {OffchainVotingSubmitResultAction} from './voting/OffchainVotingSubmitResultAction';
import {ProposalData, ProposalFlowStatus} from './types';
import {useProposalFlowStatus} from './hooks/useProposalFlowStatus';
import SponsorAction from './SponsorAction';

type ProposalActionsProps = {
  adpaterName: ContractAdapterNames;
  proposal: ProposalData;
};

export default function ProposalActions(props: ProposalActionsProps) {
  const {adpaterName, proposal} = props;

  /**
   * Our hooks
   */

  const proposalStatus = useProposalFlowStatus(proposal);

  /**
   * Render
   */

  if (!proposalStatus) return null;

  return (
    <div className="proposaldetails__button-container">
      {/* SPONSOR BUTTON */}
      {proposalStatus === ProposalFlowStatus.Sponsor && (
        <SponsorAction proposal={proposal} />
      )}

      {/* OFF-CHAIN VOTING STATUS */}
      {(proposalStatus === ProposalFlowStatus.OffchainVoting ||
        proposalStatus === ProposalFlowStatus.OffchainVotingSubmitResult ||
        proposalStatus === ProposalFlowStatus.OffchainVotingGracePeriod ||
        proposalStatus === ProposalFlowStatus.Process ||
        proposalStatus === ProposalFlowStatus.Completed) && (
        <OffchainVotingStatus proposal={proposal} />
      )}

      {/* OFF-CHAIN VOTING BUTTONS */}
      {proposalStatus === ProposalFlowStatus.OffchainVoting && (
        <OffchainVotingAction adapterName={adpaterName} proposal={proposal} />
      )}

      {/* SUBMIT VOTE RESULT */}
      {proposalStatus === ProposalFlowStatus.OffchainVotingSubmitResult && (
        <OffchainVotingSubmitResultAction
          adapterName={adpaterName}
          proposal={proposal}
        />
      )}
    </div>
  );
}
