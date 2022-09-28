import {memo, useEffect} from 'react';
import {useHistory} from 'react-router-dom';
import AOS from 'aos';
import '../../../node_modules/aos/dist/aos.css';

import {CenterLogo} from '../../components/logo';
import {NavHamburger} from '../../components/Nav';
import FadeIn from '../../components/common/FadeIn';
// import SocialMedia from '../../components/common/SocialMedia';
import Wrap from '../../components/common/Wrap';
import {ENABLE_KYC_ONBOARDING} from '../../config';
import Footer from '../../components/Footer';

const TributeSpace = memo(() => {
  return (
    <div className="interest_submit-container">
      <div className="interest_submit_flower">
        <img
          className="submit-space"
          src="https://res.cloudinary.com/cinecapsule/image/upload/v1653638127/Films-on-Mars_wfxgzm.png"
          alt="astronaut"
          aria-label="Space background"
          role="presentation"
        />
        <br></br>
      </div>
    </div>
  );
});

function GetStartedHeader() {
  return (
    <div data-testid="get-started-header" className="landing__header">
      {/*<SocialMedia ></SocialMedia>*/}
      <NavHamburger />
    </div>
  );
}

export default function GetStarted() {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Effects
   */

  useEffect(() => {
    AOS.init({
      duration: 800,
      offset: 40,
      delay: 120,
      mirror: false,
      once: true,
    });
  }, []);

  /**
   * Render
   */

  return (
    <>
      <GetStartedHeader />

      <div className="row">
        <Wrap className="section-wrapper">
          <FadeIn>
            <CenterLogo />
            <div className="landing">
              <div className="landing__subtitle">
                A DAO SUPPORTING INDEPENDENT CINEMA
              </div>
              <div className="landing__img">
                <TributeSpace />
              </div>
              <div className="landing__button">
                <button
                  className="button"
                  onClick={() => {
                    history.push(ENABLE_KYC_ONBOARDING ? '/join' : '/onboard');
                  }}>
                  BECOME A MEMBER
                </button>
              </div>
              <br></br>
              <div className="landing__link">
                <a href="https://medium.com/@OpenLawOfficial/introducing-the-tribute-dao-framework-3f2f0ed50d62" target="_blank" rel="noopener noreferrer">
                  LEARN MORE
                </a>
              </div>
            </div>
            <br></br>
            <div className="interest_submit-proposal_xyz">
              <span
                className="interest_submit-proposal__image__1JcQq"
                aria-label="Unicorn emoji"
                role="img">
                🎥
              </span>
              <br></br>
              <div className="interest_submit-proposal__title__dZrRm">
                Looking for funding?
              </div>
              <div className="interest_submit-proposal-slogan">
                CineCapsule is a group of  enthusiasts and experts
                supporting the work of independent Film Festivals.
                <br></br><strong>If you are a film producer or director, join the DAO and make a proposal
                </strong></div>
              <button
                className="button_submit_proposal"
                onClick={() => {
                  history.push(ENABLE_KYC_ONBOARDING ? '/onboard' : '/governance-proposal');
                }}>
                Submit a proposal
              </button>
            </div>
          </FadeIn>
        </Wrap>
      </div>
      <Footer />
    </>
  );
}
