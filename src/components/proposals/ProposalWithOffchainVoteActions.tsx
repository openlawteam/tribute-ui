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
import {
  useOffchainVotingResults,
  useProposalWithOffchainVoteStatus,
} from './hooks';
import {ContractAdapterNames, ContractDAOConfigKeys} from '../web3/types';
import {useDaoConfigurations} from '../../hooks';
import {VotingAdapterName} from '../adapters-extensions/enums';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import ProcessAction from './ProcessAction';
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

const configurationKeysToGet: ContractDAOConfigKeys[] = [
  ContractDAOConfigKeys.offchainVotingVotingPeriod,
  ContractDAOConfigKeys.offchainVotingGracePeriod,
];

export default function ProposalWithOffchainVoteActions(
  props: ProposalWithOffchainActionsProps
) {
  const {adapterName, proposal, renderAction: renderActionProp} = props;

  /**
   * Our hooks
   */

  const {
    daoConfigurations: [offchainVotingPeriod, offchainGracePeriod],
  } = useDaoConfigurations(configurationKeysToGet);

  const {
    daoProposalVoteResult,
    daoProposalVote,
    proposalFlowStatusError,
    status,
  } = useProposalWithOffchainVoteStatus(proposal);

  const {offchainVotingResults} = useOffchainVotingResults(
    proposal.snapshotProposal
  );

  /**
   * Variables
   */

  /**
   * Set the grace period start milliseconds either by
   *
   * 1) the DAO's grace period start timestamp,
   * 2) or by `Date.now()` (i.e. no result was submitted).
   *
   * We fall back to case 2 so that the grace period timer will
   * start, as it requires any `Number` above `0`.
   */
  const gracePeriodStartMs: number =
    daoProposalVote && status === ProposalFlowStatus.OffchainVotingGracePeriod
      ? Number(daoProposalVote.gracePeriodStartingTime) * 1000 || Date.now()
      : 0;

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
        daoProposalVote,
        gracePeriodStartMs,
        proposal,
        status,
      },
    });

  // There is only one vote result entry as we only passed a single proposal
  const offchainVotingResult = offchainVotingResults[0]?.[1];
  const yesUnits = offchainVotingResult?.Yes.units || 0;
  const noUnits = offchainVotingResult?.No.units || 0;

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
      // Return a React.Fragment to hide the "Submit Vote Result" button if vote
      // did not pass. For now, we can assume across all adapters that if the
      // vote did not pass then the vote result does not need to be submitted.
      if (yesUnits <= noUnits) {
        return <></>;
      }

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
          votingResult={offchainVotingResult}
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
