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
            <div className="cube">
              <div className="cube__segment--top"></div>
              <div className="cube__segment--left"></div>
              <div className="cube__segment--right"></div>
            </div>

            {/* <div className="cube">
              <div className="cube__segment--top">
                <div>
                  <h2>Top cube face</h2>
                  <p>
                    The top face is nested in an extra div tag to give correct
                    rotation of skewed rectangle.
                  </p>
                  <p>
                    This face is also scaled, so the font size has been reduced
                    to accommodate.
                  </p>
                </div>
              </div>
              <div className="cube__segment--left">
                <h2>Left cube face</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse
                  cillum dolore eu fugiat nulla pariatur. Excepteur sint
                  occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                </p>
              </div>
              <div className="cube__segment--right">
                <h2>Right cube face</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            </div> */}
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
