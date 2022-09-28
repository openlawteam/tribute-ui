import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import React from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import {GovernanceActions} from '../../components/governance';
import {useIsDefaultChain} from '../../components/web3/hooks';
import {useProposalOrDraft} from '../../components/proposals/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import NotFound from '../subpages/NotFound';
import ProposalDetails from '../../components/proposals/ProposalDetails';
import Wrap from '../../components/common/Wrap';

export default function GovernanceProposalDetails() {
  /**
   * Their hooks
   */

  // Get hash for fetching the proposal.
  const {proposalId} = useParams<{proposalId: string}>();

  /**
   * Our hooks
   */

  const {proposalData, proposalError, proposalNotFound, proposalStatus} =
    useProposalOrDraft(proposalId, SnapshotType.proposal);

  const {defaultChainError} = useIsDefaultChain();

  /**
   * Variables
   */

  const isLoading: boolean = proposalStatus === AsyncStatus.PENDING;
  const error: Error | undefined = proposalError || defaultChainError;

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
    return (
      <RenderWrapper>
        <ProposalDetails
          proposal={proposalData}
          renderActions={() => <GovernanceActions proposal={proposalData} />}
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

  function viewAll(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    history.push('/governance');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Governance</h2>
          
          <button className="titlebar__action" onClick={viewAll}>
            View all
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
