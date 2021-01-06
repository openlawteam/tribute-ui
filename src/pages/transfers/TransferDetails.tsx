import React from 'react';
import {useHistory} from 'react-router-dom';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function TransferDetails() {
  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div>TransferDetails @todo</div>
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

  function viewAll(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    history.push('/transfers');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Transfers</h2>
          <button
            className="titlebar__action org-titlebar__action"
            onClick={viewAll}>
            View all
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
