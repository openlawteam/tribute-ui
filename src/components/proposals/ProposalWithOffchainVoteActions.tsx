import React from 'react';

import {ContractAdapterNames} from '../web3/types';
import {CycleEllipsis} from '../feedback';
import {OffchainOpRollupVotingSubmitResultAction} from './voting';
import {OffchainVotingStatus, OffchainVotingAction} from './voting';
import {ProposalData, ProposalFlowStatus} from './types';
import {useProposalWithOffchainVoteStatus} from './hooks';
import SponsorAction from './SponsorAction';

type ProposalWithOffchainActionsProps = {
  adpaterName: ContractAdapterNames;
  proposal: ProposalData;
};

export default function ProposalWithOffchainVoteActions(
  props: ProposalWithOffchainActionsProps
) {
  const {adpaterName, proposal} = props;

  /**
   * Our hooks
   */

  const {daoProposalVotes, status} = useProposalWithOffchainVoteStatus(
    proposal
  );

  /**
   * Variables
   */

  // Set the grace period start (per the DAO's timestamp) if the status says we're in grace period.
  const gracePeriodStartMs: number =
    daoProposalVotes && status === ProposalFlowStatus.OffchainVotingGracePeriod
      ? Number(daoProposalVotes.gracePeriodStartingTime) * 1000
      : 0;

  /**
   * Render
   */
  return (
    <>
      {/* OFF-CHAIN VOTING STATUS */}
      {(status === ProposalFlowStatus.OffchainVoting ||
        status === ProposalFlowStatus.OffchainVotingSubmitResult ||
        status === ProposalFlowStatus.OffchainVotingGracePeriod ||
        status === ProposalFlowStatus.Process ||
        status === ProposalFlowStatus.Completed) && (
        <OffchainVotingStatus
          countdownGracePeriodStartMs={gracePeriodStartMs}
          proposal={proposal}
        />
      )}

      <div className="proposaldetails__button-container">
        {/* SPONSOR BUTTON */}
        {status === ProposalFlowStatus.Sponsor && (
          <SponsorAction proposal={proposal} />
        )}

        {/* OFF-CHAIN VOTING BUTTONS */}
        {status === ProposalFlowStatus.OffchainVoting && (
          <OffchainVotingAction adapterName={adpaterName} proposal={proposal} />
        )}

        {/* OFF-CHAIN VOTING SUBMIT VOTE RESULT */}
        {/* @todo A wrapping component to get the correct off-chain voting component */}
        {status === ProposalFlowStatus.OffchainVotingSubmitResult && (
          <OffchainOpRollupVotingSubmitResultAction
            adapterName={adpaterName}
            proposal={proposal}
          />
        )}

        {/* Disable when in grace period */}
        {(status === ProposalFlowStatus.OffchainVotingGracePeriod ||
          status === ProposalFlowStatus.Process) && (
          <button
            disabled={status === ProposalFlowStatus.OffchainVotingGracePeriod}>
            Process
          </button>
        )}
      </div>
    </>
  );
}
