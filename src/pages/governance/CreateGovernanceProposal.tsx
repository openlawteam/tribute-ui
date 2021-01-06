import React from 'react';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function CreateGovernanceProposal() {
  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div>CreateGovernanceProposal @todo</div>
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
          <h2 className="titlebar__title">Governance Proposal</h2>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
