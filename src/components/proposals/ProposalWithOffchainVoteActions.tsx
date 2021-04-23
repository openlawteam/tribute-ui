import {
  OffchainVotingStatus,
  OffchainVotingAction,
  OffchainOpRollupVotingSubmitResultAction,
} from './voting';
import {VotingState} from './voting/types';
import {ContractAdapterNames} from '../web3/types';
import {ProposalData, ProposalFlowStatus} from './types';
import {useProposalWithOffchainVoteStatus} from './hooks';
import SponsorAction from './SponsorAction';
import ProcessAction from './ProcessAction';
import PostProcessAction from './PostProcessAction';

type ProposalWithOffchainActionsProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
};

export default function ProposalWithOffchainVoteActions(
  props: ProposalWithOffchainActionsProps
) {
  const {adapterName, proposal} = props;

  /**
   * Our hooks
   */

  const {
    daoProposalVotes,
    status,
    daoProposalVoteResult,
  } = useProposalWithOffchainVoteStatus(proposal);

  /**
   * Variables
   */

  // Set the grace period start (per the DAO's timestamp) if the status says we're in grace period.
  const gracePeriodStartMs: number =
    daoProposalVotes && status === ProposalFlowStatus.OffchainVotingGracePeriod
      ? Number(daoProposalVotes.gracePeriodStartingTime) * 1000
      : 0;

  //  Currently, only Distribute adapter has an action that occurs after the
  //  proposal is processed.
  const showPostProcessAction =
    adapterName === ContractAdapterNames.distribute &&
    status === ProposalFlowStatus.Completed &&
    daoProposalVoteResult &&
    VotingState[daoProposalVoteResult] === VotingState[VotingState.PASS];

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
          <OffchainVotingAction adapterName={adapterName} proposal={proposal} />
        )}

        {/* OFF-CHAIN VOTING SUBMIT VOTE RESULT */}
        {/* @todo Perhaps use a wrapping component to get the correct off-chain voting component (e.g. op-rollup, batch) */}
        {status === ProposalFlowStatus.OffchainVotingSubmitResult && (
          <OffchainOpRollupVotingSubmitResultAction
            adapterName={adapterName}
            proposal={proposal}
          />
        )}

        {(status === ProposalFlowStatus.OffchainVotingGracePeriod ||
          status === ProposalFlowStatus.Process) && (
          <ProcessAction
            // Show during DAO proposal grace period, but set to disabled
            disabled={status === ProposalFlowStatus.OffchainVotingGracePeriod}
            proposal={proposal}
          />
        )}

        {showPostProcessAction && (
          <PostProcessAction adapterName={adapterName} proposal={proposal} />
        )}
      </div>
    </>
  );
}
