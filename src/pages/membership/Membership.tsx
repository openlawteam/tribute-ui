import React from 'react';
import {useHistory} from 'react-router-dom';

import {ProposalHeaderNames} from '../../util/enums';
import {truncateEthAddress} from '../../util/helpers';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import ProposalCard from '../../components/proposals/ProposalCard';
import {
  fakeMemberProposalsVoting,
  fakeMemberProposalsRequest,
  fakeMemberProposalsPassed,
  fakeMemberProposalsFailed,
  FakeProposal,
} from '../../components/proposals/_mockData';

export default function Membership() {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Variables
   */

  const votingProposals = renderProposalCards(fakeMemberProposalsVoting);
  const requestProposals = renderProposalCards(fakeMemberProposalsRequest);
  const passedProposals = renderProposalCards(fakeMemberProposalsPassed);
  const failedProposals = renderProposalCards(fakeMemberProposalsFailed);

  /**
   * Functions
   */

  function renderProposalCards(proposals: FakeProposal[]) {
    return proposals.map((proposal) => {
      return (
        <ProposalCard
          key={proposal.snapshotProposal.hash}
          onClick={handleClickProposalDetails(proposal.snapshotProposal.hash)}
          proposal={proposal}
          name={truncateEthAddress(proposal.snapshotProposal.name, 7)}
        />
      );
    });
  }

  function handleClickProposalDetails(proposalHash: string) {
    return () => {
      if (!proposalHash) return;

      history.push(`/membership/${proposalHash}`);
    };
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div className="grid--fluid grid-container">
        {/* VOTING PROPOSALS */}
        {votingProposals.length > 0 && (
          <>
            <div className="grid__header">{ProposalHeaderNames.VOTING}</div>
            <div className="grid__cards">{votingProposals}</div>
          </>
        )}

        {/* PENDING PROPOSALS (DRAFTS, NOT SPONSORED) */}
        {requestProposals.length > 0 && (
          <>
            <div className="grid__header">{ProposalHeaderNames.REQUESTS}</div>
            <div className="grid__cards">{requestProposals}</div>
          </>
        )}

        {/* PASSED PROPOSALS */}
        {passedProposals.length > 0 && (
          <>
            <div className="grid__header">{ProposalHeaderNames.PASSED}</div>
            <div className="grid__cards">{passedProposals}</div>
          </>
        )}

        {/* FAILED PROPOSALS */}
        {failedProposals.length > 0 && (
          <>
            <div className="grid__header">{ProposalHeaderNames.FAILED}</div>
            <div className="grid__cards">{failedProposals}</div>
          </>
        )}
      </div>
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Membership</h2>
        </div>
        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
