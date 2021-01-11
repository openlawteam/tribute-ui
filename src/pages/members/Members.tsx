import React from 'react';
import {useHistory} from 'react-router-dom';

import {ProposalHeaderNames} from '../../util/enums';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import ProposalCard from '../../components/snapshot/ProposalCard';
import {
  fakeMemberProposalsVoting,
  fakeMemberProposalsRequest,
  fakeMemberProposalsPassed,
  fakeMemberProposalsFailed,
  FakeProposal,
} from '../../components/snapshot/_mockData';

export default function Members() {
  /**
   * External hooks
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
          snapshotProposal={proposal.snapshotProposal}
        />
      );
    });
  }

  function handleClickProposalDetails(proposalHash: string) {
    return () => {
      if (!proposalHash) return;

      history.push(`/members/${proposalHash}`);
    };
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <section className="grid--fluid grid-container">
        {/* VOTING PROPOSALS */}
        <>
          <div className="grid__header">{ProposalHeaderNames.VOTING}</div>
          <div className="grid__cards">{votingProposals}</div>
        </>

        {/* PENDING PROPOSALS (DRAFTS, NOT SPONSORED) */}
        <>
          <div className="grid__header">{ProposalHeaderNames.REQUESTS}</div>
          <div className="grid__cards">{requestProposals}</div>
        </>

        {/* PASSED PROPOSALS */}
        <>
          <div className="grid__header">{ProposalHeaderNames.PASSED}</div>
          <div className="grid__cards">{passedProposals}</div>
        </>

        {/* FAILED PROPOSALS */}
        <>
          <div className="grid__header">{ProposalHeaderNames.FAILED}</div>
          <div className="grid__cards">{failedProposals}</div>
        </>
      </section>
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
          <h2 className="titlebar__title">Members</h2>
        </div>
        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
