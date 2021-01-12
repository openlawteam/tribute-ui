import React from 'react';
import {useHistory} from 'react-router-dom';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function Tributes() {
  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div>Tributes @todo</div>
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
    history.push('/tribute');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Tributes</h2>
          <button className="titlebar__action" onClick={goToNewProposal}>
            Provide Tribute
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
