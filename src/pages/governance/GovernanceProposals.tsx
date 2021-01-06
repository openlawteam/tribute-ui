import React from 'react';
import {useHistory} from 'react-router-dom';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function GovernanceProposals() {
  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div>GovernanceProposals @todo</div>
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * External hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function goToNewProposal(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    history.push('/governance-proposal');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Governance</h2>
          <button
            className="titlebar__action org-titlebar__action"
            onClick={goToNewProposal}>
            New Proposal
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
