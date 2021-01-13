import React from 'react';
import {useHistory} from 'react-router-dom';

import {CenterLogo} from '../../components/logo';
import {NavLinks} from '../../components/Nav';
import FadeIn from '../../components/common/FadeIn';
import Wrap from '../../components/common/Wrap';

export default function GetStarted() {
  /**
   * Their hooks
   */

  const history = useHistory();

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <header className="header">
          <CenterLogo />
        </header>

        <div className="landing">
          <div className="landing__subtitle">
            <p>For the ongoing development of Moloch v3</p>
          </div>

          <div className="landing__img">
            {/** @note TEMP SPAN */}
            <span>[tribute cube img]</span>
          </div>

          <div className="landing__button">
            {/* @todo Display Join button only if user is not a member */}
            <button
              className="button"
              onClick={() => {
                history.push('/join');
              }}>
              Join
            </button>
          </div>

          <div className="landing__navlinks">
            <NavLinks />
          </div>
        </div>
      </FadeIn>
    </Wrap>
  );
}
