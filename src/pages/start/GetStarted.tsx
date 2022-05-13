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

// const TributeCube = memo(() => {
//   return (
//     <div
//       className="cube"
//       data-testid="cube"
//       data-aos="fade-up"
//       data-aos-delay="150">
//       <div className="cube__segment--top"></div>
//       <div className="cube__segment--left"></div>
//       <div className="cube__segment--right"></div>
//     </div>
//   );
// });

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

              {/* <div className="landing__img">
              <TributeCube />
            </div> */}

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
              <div>
                <a
                  className="landing__link"
                  href=""
                  target="_blank"
                  rel="noopener noreferrer">
                  LEARN MORE
                </a>
              </div>
            </div>
            <br></br>
          </FadeIn>
        </Wrap>
        <div className="interest_submit-container">
          <div className="interest_submit_flower">
            <img className="submit-space"
              src="https://i.ibb.co/CKmB0MR/Films-on-Mars.png"
              alt="flower" 
              aria-label="Unicorn emoji"
              role="img"
            />
            <br></br>
          </div>
        </div>
      </div>
      
        <div className="interest_submit-proposal_xyz">
          <span
            className="interest_submit-proposal__image__1JcQq"
            aria-label="Unicorn emoji"
            role="img">
            📽
          </span>
          <br></br>
          <div className="interest_submit-proposal__title__dZrRm">
            Looking for funding?
          </div>
          <div className="interest_submit-proposal-slogan">
            CapsuleProd is a global group of Fuse enthusiasts and experts
            supporting the work of Fuse builders.
          </div>
          <button
            className="button_submit_proposal"
            onClick={() => {
              history.push(ENABLE_KYC_ONBOARDING ? '/join' : '/onboarding');
            }}>
            Submit a proposal
          </button>
        </div>
      <Footer />
    </>
  );
}

