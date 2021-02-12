import React from 'react';

import {ContractAdapterNames} from '../web3/types';
import {OffchainOpRollupVotingSubmitResultAction} from './voting';
import {OffchainVotingStatus, OffchainVotingAction} from './voting';
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
      {/* OFF-CHAIN VOTING STATUS */}
      {/* @todo Check which type of voting is enabled */}
      {(proposalStatus === ProposalFlowStatus.OffchainVoting ||
        proposalStatus === ProposalFlowStatus.OffchainVotingSubmitResult ||
        proposalStatus === ProposalFlowStatus.OffchainVotingGracePeriod ||
        proposalStatus === ProposalFlowStatus.Process ||
        proposalStatus === ProposalFlowStatus.Completed) && (
        <OffchainVotingStatus proposal={proposal} />
      )}

      {/* SPONSOR BUTTON */}
      {proposalStatus === ProposalFlowStatus.Sponsor && (
        <SponsorAction proposal={proposal} />
      )}

      {/* OFF-CHAIN VOTING BUTTONS */}
      {proposalStatus === ProposalFlowStatus.OffchainVoting && (
        <OffchainVotingAction adapterName={adpaterName} proposal={proposal} />
      )}

      {/* OFF-CHAIN VOTING (OPT. ROLLUP) SUBMIT VOTE RESULT */}
      {/* @todo Perhaps a wrapping component to get the correct off-chain voting component */}
      {proposalStatus === ProposalFlowStatus.OffchainVotingSubmitResult && (
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={adpaterName}
          proposal={proposal}
        />
      )}
    </div>
  );
}
