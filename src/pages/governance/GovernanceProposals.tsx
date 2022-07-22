import React from 'react';
import {useHistory} from 'react-router-dom';

import {BURN_ADDRESS} from '../../util/constants';
import FadeIn from '../../components/common/FadeIn';
import GovernanceProposalsList from '../../components/governance/GovernanceProposalsList';
import Wrap from '../../components/common/Wrap';

export default function GovernanceProposals() {
  /**
   * Functions
   */

  function proposalLinkPath(id: string) {
    return `/governance/${id}`;
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <GovernanceProposalsList
        actionId={BURN_ADDRESS}
        proposalLinkPath={proposalLinkPath}
      />
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Their hooks
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
          <p>
            CineCapsule  is run entirely by its members.<br></br> 
            Below are all the governance votes and proposals.
          </p>
          <p>Otherwise, you can submit a new proposal</p>

          <button className="titlebar__action" onClick={goToNewProposal}>
            New Proposal
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
