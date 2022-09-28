import React from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {
  ProposalFlowStatus,
  RenderActionPropArguments,
} from '../../components/proposals/types';
import {AsyncStatus} from '../../util/types';
import {ContractAdapterNames} from '../../components/web3/types';
import {useIsDefaultChain} from '../../components/web3/hooks';
import {useProposalOrDraft} from '../../components/proposals/hooks';
import {VotingState} from '../../components/proposals/voting/types';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import NotFound from '../subpages/NotFound';
import ProcessActionOnboarding from '../../components/proposals/ProcessActionOnboarding';
import ProposalActions from '../../components/proposals/ProposalActions';
import SubmitAction from '../../components/proposals/SubmitAction';
import ProposalAmount from '../../components/proposals/ProposalAmount';
import ProposalDetails from '../../components/proposals/ProposalDetails';
import Wrap from '../../components/common/Wrap';

const PLACEHOLDER = '\u2014'; /* em dash */

export default function OnboardingDetails() {
  /**
   * @todo
   *
   * 1. Fetch proposal by ID from the subgraph.
   * 2. Determine if sponsored
   * 3. Get Snapshot data
   *   3.1 If sponsored, get data about proposal from Snapshot (use flag to also search by draft hash).
   *   3.2 If not sponsored, get data about draft from Snapshot.
   */

  /**
   * Their hooks
   */

  // Get hash for fetching the proposal.
  const {proposalId} = useParams<{proposalId: string}>();

  /**
   * @todo Get subgraph proposal and determine if it has been sponsored
   *   so we know how to search snapshot-hub.
   */

  // ...

  /**
   * Our hooks
   */

  // @todo Use dynamic `SnapshotType` depending on subgraph data for `type` arg.
  const {proposalData, proposalError, proposalNotFound, proposalStatus} =
    useProposalOrDraft(proposalId);

  const {defaultChainError} = useIsDefaultChain();

  /**
   * Variables
   */

  const isLoading: boolean = proposalStatus === AsyncStatus.PENDING;
  const error: Error | undefined = proposalError || defaultChainError;

  /**
   * Functions
   */

  // Render any adapter-specific actions
  function renderAction(data: RenderActionPropArguments): React.ReactNode {
    const {
      OffchainVotingContract: {daoProposalVoteResult, proposal, status},
    } = data;

    // Submit/Sponsor button (for proposals that have not been submitted onchain yet)
    if (status === ProposalFlowStatus.Submit) {
      const {snapshotDraft} = proposal;
      const applicant = snapshotDraft?.msg.payload.metadata.submitActionArgs[0];

      return <SubmitAction checkApplicant={applicant} proposal={proposal} />;
    }

    // Process button
    if (
      status === ProposalFlowStatus.Process ||
      status === ProposalFlowStatus.OffchainVotingGracePeriod
    ) {
      if (
        daoProposalVoteResult &&
        VotingState[daoProposalVoteResult] !== VotingState[VotingState.PASS]
      ) {
        // Return a React.Fragment to hide the process button if proposal failed.
        return <></>;
      }

      return (
        <ProcessActionOnboarding
          // Show during DAO proposal grace period, but set to disabled
          disabled={status === ProposalFlowStatus.OffchainVotingGracePeriod}
          proposal={proposal}
        />
      );
    }

    // Return `null` to signal to use default actions
    return null;
  }

  /**
   * Render
   */

  // Render loading
  if (isLoading && !error) {
    return (
      <RenderWrapper>
        <div className="loader--large-container">
          <LoaderLarge />
        </div>
      </RenderWrapper>
    );
  }

  // Render 404 no proposal found
  if (proposalNotFound) {
    return (
      <RenderWrapper>
        <NotFound />
      </RenderWrapper>
    );
  }

  // Render error
  if (error) {
    return (
      <RenderWrapper>
        <div className="text-center">
          <ErrorMessageWithDetails
            error={error}
            renderText="Something went wrong while getting the proposal."
          />
        </div>
      </RenderWrapper>
    );
  }

  // Render proposal
  if (proposalData) {
    const commonData = proposalData.getCommonSnapshotProposalData();

    // Handle just in case metadata was not properly set
    let tributeAmount = PLACEHOLDER;
    let tributeAmountUnit = '';
    try {
      ({tributeAmount, tributeAmountUnit} =
        commonData?.msg.payload.metadata.proposalAmountValues);
    } catch (error) {
      tributeAmount = PLACEHOLDER;
      tributeAmountUnit = '';
    }

    return (
      <RenderWrapper>
        <ProposalDetails
          proposal={proposalData}
          renderAmountBadge={() => (
            <ProposalAmount
              amount={tributeAmount}
              amountUnit={tributeAmountUnit}
            />
          )}
          renderActions={() => (
            <ProposalActions
              adapterName={ContractAdapterNames.onboarding}
              proposal={proposalData}
              renderAction={renderAction}
            />
          )}
        />
      </RenderWrapper>
    );
  }

  // Render nothing. Should never reach this case.
  return <></>;
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function goToAll(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    history.push('/onboarding');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Onbording</h2>
          <button className="titlebar__action" onClick={goToAll}>
            View all
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
