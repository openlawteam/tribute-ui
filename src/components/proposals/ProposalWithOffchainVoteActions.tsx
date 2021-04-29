import {
  OffchainVotingStatus,
  OffchainVotingAction,
  OffchainOpRollupVotingSubmitResultAction,
} from './voting';
import {
  ProposalData,
  ProposalFlowStatus,
  RenderActionPropArguments,
} from './types';
import {ContractAdapterNames} from '../web3/types';
import {useProposalWithOffchainVoteStatus} from './hooks';
import {VotingAdapterName} from '../adapters-extensions/enums';
import {VotingState} from './voting/types';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import PostProcessAction from './PostProcessAction';
import ProcessAction from './ProcessAction';
import ProcessActionTribute from './ProcessActionTribute';
import SponsorAction from './SponsorAction';
import SubmitAction from './SubmitAction';

type ProposalWithOffchainActionsProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
  /**
   * A render prop which can render any action desired.
   * It is passed inner state and data from
   * the child action wrapper component.
   *
   * - If it renders `null`, it will fall back to the component's actions.
   * - If it renders `<></>` (`React.Fragment`) then nothing is shown in the UI.
   */
  renderAction?: (data: RenderActionPropArguments) => React.ReactNode;
};

export default function ProposalWithOffchainVoteActions(
  props: ProposalWithOffchainActionsProps
) {
  const {adapterName, proposal, renderAction: renderActionProp} = props;

  /**
   * Our hooks
   */

  const {
    daoProposalVoteResult,
    daoProposalVotes,
    proposalFlowStatusError,
    status,
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
   * If a render prop was provided it will render it and pass
   * internal state and data up to the parent component.
   */
  const renderedActionFromProp =
    renderActionProp &&
    renderActionProp({
      [VotingAdapterName.OffchainVotingContract]: {
        adapterName,
        daoProposalVoteResult,
        daoProposalVotes,
        gracePeriodStartMs,
        proposal,
        status,
      },
    });

  /**
   * Functions
   */

  function renderActions(): React.ReactNode {
    // If render prop did not return `null` then render its content
    if (renderedActionFromProp) {
      return renderedActionFromProp;
    }

    // Submit/Sponsor button (for proposals that have not been submitted onchain yet)
    if (status === ProposalFlowStatus.Submit) {
      return <SubmitAction proposal={proposal} />;
    }

    // Sponsor button
    if (status === ProposalFlowStatus.Sponsor) {
      return <SponsorAction proposal={proposal} />;
    }

    // Off-chain voting buttons
    if (status === ProposalFlowStatus.OffchainVoting) {
      return (
        <OffchainVotingAction adapterName={adapterName} proposal={proposal} />
      );
    }

    // Off-chain voting submit vote result
    if (status === ProposalFlowStatus.OffchainVotingSubmitResult) {
      return (
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={adapterName}
          proposal={proposal}
        />
      );
    }

    // Process button
    if (
      status === ProposalFlowStatus.Process ||
      status === ProposalFlowStatus.OffchainVotingGracePeriod
    ) {
      return (
        <ProcessAction
          // Show during DAO proposal grace period, but set to disabled
          disabled={status === ProposalFlowStatus.OffchainVotingGracePeriod}
          proposal={proposal}
        />
      );
    }

    // Post-process button
    // @todo Remove and use render prop
    if (showPostProcessAction) {
      return (
        <PostProcessAction adapterName={adapterName} proposal={proposal} />
      );
    }
  }

  /**
   * Render
   */

  return (
    <>
      {/* STATUS */}

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

      {/* ACTIONS */}

      <div className="proposaldetails__button-container">{renderActions()}</div>

      {/* ERROR */}

      <ErrorMessageWithDetails
        error={proposalFlowStatusError}
        renderText="Something went wrong while getting the proposal's status"
      />
    </>
  );
}
