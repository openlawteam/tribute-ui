import React from 'react';
import {useHistory} from 'react-router-dom';

import {DaoAdapterConstants} from '../../components/adapters-extensions/enums';
import FadeIn from '../../components/common/FadeIn';
import Proposals from '../../components/proposals/Proposals';
import Wrap from '../../components/common/Wrap';

export default function Transfers() {
  /**
   * Functions
   */

  function proposalLinkPath(id: string) {
    return `/transfers/${id}`;
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <Proposals
        adapterName={DaoAdapterConstants.DISTRIBUTE}
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
    history.push('/transfer');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Transfers</h2>
          <button className="titlebar__action" onClick={goToNewProposal}>
            Make Transfer
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
