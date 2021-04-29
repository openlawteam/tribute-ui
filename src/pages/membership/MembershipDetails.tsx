import React from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import {ContractAdapterNames} from '../../components/web3/types';
import {useProposalOrDraft} from '../../components/proposals/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import NotFound from '../subpages/NotFound';
import ProposalActions from '../../components/proposals/ProposalActions';
import ProposalAmount from '../../components/proposals/ProposalAmount';
import ProposalDetails from '../../components/proposals/ProposalDetails';
import Wrap from '../../components/common/Wrap';
import {
  ProposalFlowStatus,
  RenderActionPropArguments,
} from '../../components/proposals/types';
import {VotingState} from '../../components/proposals/voting/types';
import ProcessActionMembership from '../../components/proposals/ProcessActionMembership';

const PLACEHOLDER = '\u2014'; /* em dash */

export default function MembershipDetails() {
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
  const {
    proposalData,
    proposalError,
    proposalNotFound,
    proposalStatus,
  } = useProposalOrDraft(proposalId);

  /**
   * Functions
   */

  // Render any adapter-specific actions
  function renderAction(data: RenderActionPropArguments) {
    const {
      OffchainVotingContract: {daoProposalVoteResult, proposal, status},
    } = data;

    if (
      status === ProposalFlowStatus.Process ||
      status === ProposalFlowStatus.OffchainVotingGracePeriod
    ) {
      return (
        <ProcessActionMembership
          // Show during DAO proposal grace period, but set to disabled
          disabled={status === ProposalFlowStatus.OffchainVotingGracePeriod}
          proposal={proposal}
          isProposalPassed={
            !!(
              daoProposalVoteResult &&
              VotingState[daoProposalVoteResult] ===
                VotingState[VotingState.PASS]
            )
          }
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
  if (proposalStatus === AsyncStatus.PENDING) {
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
  if (proposalStatus === AsyncStatus.REJECTED || proposalError) {
    return (
      <RenderWrapper>
        <div className="text-center">
          <ErrorMessageWithDetails
            error={proposalError}
            renderText="Something went wrong."
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
      ({
        tributeAmount,
        tributeAmountUnit,
      } = commonData?.msg.payload.metadata.proposalAmountValues);
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

    history.push('/membership');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Membership</h2>
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
