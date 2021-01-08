import React from 'react';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import ProposalCard from '../../components/snapshot/ProposalCard';

const dummyProposals = [
  {
    name: '0xA089E0684BD87Be6e3F343e224Da191C500883Ec',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
  {
    name: '0xE7deBE6565CD01b6152B345B689A15Eb710D21e6',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
  {
    name: '0x80C6CF52720BeD578D3E446199516CB816F67e37',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
  {
    name: '0xE00BcCddD33E9578904570409E0283C0ef511472',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
  {
    name: '0x3D1AaFD15850544b358738c89afC4608F8351D2C',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
  {
    name: '0x9b5D3d12055B7b70E839e12417a2B9cE5ED9965c',
    body:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et',
  },
];

export default function Members() {
  /**
   * Variables
   */

  const votingProposals = renderProposalCards(dummyProposals);

  /**
   * Functions
   */

  function renderProposalCards(
    proposals: {name: string; body: string}[],
    headerName?: string
  ) {
    return proposals.map((proposal) => {
      const renderVerbose = headerName === 'New Member Voting';

      return (
        <ProposalCard
          key={proposal.name}
          name={proposal.name}
          shouldRenderVerbose={renderVerbose}
        />
      );
    });
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <section className="grid--fluid grid-container">
        <>
          <div className="grid__header">New Member Voting</div>
          <div className="grid__cards">{votingProposals}</div>
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
