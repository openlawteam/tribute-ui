import {useMemo} from 'react';

import {
  OffchainVotingStatus,
  OffchainVotingAction,
  OffchainOpRollupVotingSubmitResultAction,
  OffchainVotingStatusRenderStatusProps,
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
import {CycleEllipsis} from '../feedback';
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

const {
  Completed,
  OffchainVotingGracePeriod,
  OffchainVotingSubmitResult,
  OffchainVoting,
  Process,
  Sponsor,
  Submit,
} = ProposalFlowStatus;

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
  } = useProposalWithOffchainVoteStatus(
    useMemo(
      () => ({
        proposal,
      }),
      [proposal]
    )
  );

  const {offchainVotingResults} = useOffchainVotingResults(
    proposal.snapshotProposal
  );

  /**
   * Variables
   */

  const gracePeriodStartMs: number =
    Number(daoProposalVote?.gracePeriodStartingTime || 0) * 1000;

  const gracePeriodEndMs: number | undefined =
    gracePeriodStartMs + Number(offchainGracePeriod || 0) * 1000;

  const votePeriodStartMs: number =
    Number(daoProposalVote?.startingTime || 0) * 1000;

  const votePeriodEndMs: number =
    votePeriodStartMs + Number(offchainVotingPeriod || 0) * 1000;

  // There is only one vote result entry as we only passed a single proposal
  const offchainVotingResult = offchainVotingResults[0]?.[1];
  const yesUnits = offchainVotingResult?.Yes.units || 0;
  const noUnits = offchainVotingResult?.No.units || 0;

  /**
   * If a render prop was provided it will render it and pass
   * internal state and data up to the parent component.
   */
  const renderedActionFromProp =
    renderActionProp &&
    renderActionProp({
      [VotingAdapterName.OffchainVotingContract]: {
        adapterName,
        daoProposalVote,
        daoProposalVoteResult,
        gracePeriodEndMs,
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
    if (status === Submit) {
      return <SubmitAction proposal={proposal} />;
    }

    // Sponsor button
    if (status === Sponsor) {
      return <SponsorAction proposal={proposal} />;
    }

    // Off-chain voting buttons
    if (status === OffchainVoting) {
      return (
        <OffchainVotingAction adapterName={adapterName} proposal={proposal} />
      );
    }

    // Off-chain voting submit vote result
    if (status === OffchainVotingSubmitResult) {
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
    if (status === Process || status === OffchainVotingGracePeriod) {
      return (
        <ProcessAction
          // Show during DAO proposal grace period, but set to disabled
          disabled={status === OffchainVotingGracePeriod}
          proposal={proposal}
        />
      );
    }
  }

  function renderOffchainVotingStatus({
    hasGracePeriodEnded,
  }: OffchainVotingStatusRenderStatusProps) {
    /**
     * Grace period ended label
     *
     * There is a slight lag between the JS countdown time and when the
     * contract's `block.timestamp` is updated. Therefore, the updated
     * vote result is not instantaneous.
     */
    if (hasGracePeriodEnded && status === OffchainVotingGracePeriod) {
      return (
        <span>
          Grace period ended <br />{' '}
          <span style={{textTransform: 'none'}}>
            Awaiting contract status
            <CycleEllipsis />
          </span>
        </span>
      );
    }
  }

  /**
   * Render
   */

  return (
    <>
      {/* STATUS */}
      {(status === OffchainVoting ||
        status === OffchainVotingSubmitResult ||
        status === OffchainVotingGracePeriod ||
        status === Process ||
        status === Completed) && (
        <OffchainVotingStatus
          countdownGracePeriodEndMs={gracePeriodEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          countdownVotingEndMs={votePeriodEndMs}
          countdownVotingStartMs={votePeriodStartMs}
          proposal={proposal}
          renderStatus={renderOffchainVotingStatus}
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
