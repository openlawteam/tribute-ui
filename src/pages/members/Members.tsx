import React from 'react';
import {useHistory} from 'react-router-dom';

import {truncateEthAddress} from '../../util/helpers';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import ProposalCard from '../../components/snapshot/ProposalCard';
import {
  fakeMemberProposalsVoting,
  fakeMemberProposalsPassed,
  FakeMemberProposals,
} from '../../components/snapshot/_mockData';

enum ProposalHeaderNames {
  VOTING = 'New Member Voting',
  PASSED = 'Members',
}

export default function Members() {
  /**
   * External hooks
   */

  const history = useHistory();

  /**
   * Variables
   */

  const votingProposals = renderProposalCards(
    fakeMemberProposalsVoting,
    ProposalHeaderNames.VOTING
  );
  const passedProposals = renderProposalCards(
    fakeMemberProposalsPassed,
    ProposalHeaderNames.PASSED
  );

  /**
   * Functions
   */

  function renderProposalCards(
    proposals: FakeMemberProposals[],
    headerName?: string
  ) {
    return proposals.map((proposal) => {
      const renderVerbose = headerName === ProposalHeaderNames.VOTING;

      return (
        <ProposalCard
          key={proposal.name}
          onClick={handleClickProposalDetails(proposal.name)} // @todo Replace placeholder argument
          name={truncateEthAddress(proposal.name, 7)}
          snapshotProposal={proposal.snapshotProposal}
          shouldRenderVerbose={renderVerbose}
        />
      );
    });
  }

  // @todo adjust `proposalId` to whatever is necessary for how we handle
  // proposal identifiers (e.g., hash, uuid)
  function handleClickProposalDetails(proposalId: string) {
    return () => {
      if (!proposalId) return;

      history.push(`/members/${proposalId}`);
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

        {/* PASSED PROPOSALS (MEMBERS) */}
        <>
          <div className="grid__header">{ProposalHeaderNames.PASSED}</div>
          <div className="grid__cards">{passedProposals}</div>
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
