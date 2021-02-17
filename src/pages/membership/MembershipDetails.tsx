import React from 'react';
import {useHistory, useParams} from 'react-router-dom';
import Web3 from 'web3';

import {AsyncStatus} from '../../util/types';
import {formatDecimal} from '../../util/helpers';
import {useProposalOrDraft} from '../../components/proposals/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import NotFound from '../subpages/NotFound';
import ProposalWithOffchainVoteActions from '../../components/proposals/ProposalWithOffchainVoteActions';
import ProposalDetails from '../../components/proposals/ProposalDetails';
import ProposalAmount from '../../components/proposals/ProposalAmount';
import Wrap from '../../components/common/Wrap';
import {ContractAdapterNames} from '../../components/web3/types';

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
   * Render
   */

  // Render loading
  if (proposalStatus === AsyncStatus.PENDING) {
    return (
      <RenderWrapper>
        <div style={{width: '3rem', margin: '0 auto'}}>
          <LoaderWithEmoji />
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
    const {daoProposal} = proposalData;
    const commonData = proposalData.getCommonSnapshotProposalData();

    // @todo use amount from proposal.subgraphproposal
    let amount = '\u2026';
    try {
      amount = formatDecimal(
        Number(Web3.utils.fromWei(daoProposal?.amount, 'ether'))
      );
    } catch (error) {
      // Fallback gracefully to ellipsis
    }

    return (
      <RenderWrapper>
        <ProposalDetails
          proposal={proposalData}
          renderAmountBadge={() => (
            <ProposalAmount
              amount={amount}
              amountUnit={commonData?.msg.payload.metadata.amountUnit}
            />
          )}
          renderActions={() => (
            <ProposalWithOffchainVoteActions
              adpaterName={ContractAdapterNames.onboarding}
              proposal={proposalData}
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
