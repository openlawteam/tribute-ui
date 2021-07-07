import {NavLink} from 'react-router-dom';
import {Transition} from 'react-transition-group';
import {useSelector} from 'react-redux';
import {useState, useEffect, useRef} from 'react';
import Media from 'react-media';
import ReactModal from 'react-modal';

import {ModalLogo} from './logo';
import {StoreState} from '../store/types';
import {useWeb3Modal} from './web3/hooks';
import HamburgerSVG from '../assets/svg/HamburgerSVG';
import TimesSVG from '../assets/svg/TimesSVG';
import Web3ModalButton from './web3/Web3ModalButton';
import DaoTokenHolder from './dao-token/DaoTokenHolder';

// see: http://reactcommunity.org/react-transition-group/transition
const duration = 200;

const defaultStyle = {
  transition: '0.1s',
};

const transitionOpeningStyles: Record<string, any> = {
  entering: {right: '-300px'},
  entered: {right: 0},
  exiting: {right: 0, opacity: 0},
  exited: {right: '-300px', opacity: 0},
};

const transitionClosingStyles: Record<string, any> = {
  entering: {right: 0, opacity: 1},
  entered: {right: '-300px', opacity: 1},
  exiting: {right: '-300px', opacity: 1},
  exited: {right: 0, opacity: 1},
};

export function NavLinks() {
  return (
    <nav role="navigation" id="navigation">
      <ul className="nav__list" data-testid="nav__list">
        <li tabIndex={0}>
          <NavLink to="/membership">
            <span>Membership</span>
          </NavLink>
        </li>
        <li tabIndex={0}>
          <NavLink to="/governance">
            <span>Governance</span>
          </NavLink>
        </li>
        <li tabIndex={0}>
          <NavLink to="/transfers">
            <span>Transfer</span>
          </NavLink>
        </li>
        <li tabIndex={0}>
          <NavLink to="/tributes">
            <span>Tribute</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export function NavHamburger() {
  /**
   * Selectors
   */

  const connectedMember = useSelector((s: StoreState) => s.connectedMember);

  /**
   * State
   */

  const [shouldShowMenuModal, setShouldShowMenuModal] = useState(false);
  const [transitionStyles, setTransitionStyles] = useState<Record<string, any>>(
    transitionOpeningStyles
  );

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();

  /**
   * Refs
   */

  const closeMenuRef = useRef<NodeJS.Timeout>();

  /**
   * Effects
   */

  useEffect(() => {
    // Clean up on unmount
    return () => {
      closeMenuRef.current && clearTimeout(closeMenuRef.current);
    };
  }, []);

  /**
   * Variables
   */

  const isCurrentMemberOrDelegateConnected: boolean =
    account && connectedMember?.isActiveMember ? true : false;
  const isCurrentMemberConnected: boolean =
    account &&
    connectedMember?.isActiveMember &&
    account.toLowerCase() === connectedMember?.memberAddress.toLowerCase()
      ? true
      : false;

  /**
   * Functions
   */

  function handleMenuModalClose(close: boolean) {
    // delay transition for closing
    if (close) {
      setShouldShowMenuModal(close);
      setTransitionStyles(transitionOpeningStyles);
    } else {
      setTransitionStyles(transitionClosingStyles);
      closeMenuRef.current = setTimeout(
        () => setShouldShowMenuModal(close),
        500
      );
      return () => closeMenuRef.current && clearTimeout(closeMenuRef.current);
    }
  }

  /**
   * Render
   */

  return (
    <>
      <div tabIndex={0} className="nav__hamburger-wrapper">
        <div
          className="nav__hamburger"
          aria-label="Menu"
          aria-controls="navigation"
          onClick={(event) => {
            event.preventDefault();
            handleMenuModalClose(true);
          }}>
          <HamburgerSVG />
        </div>
      </div>

      {/** MODAL MENU */}
      <ReactModal
        ariaHideApp={false}
        className="nav-modal-container"
        isOpen={shouldShowMenuModal}
        onRequestClose={() => {
          handleMenuModalClose(false);
        }}
        overlayClassName="nav-modal-overlay"
        role="dialog"
        style={{overlay: {zIndex: '99'}} as any}>
        <Transition appear in={shouldShowMenuModal} timeout={duration}>
          {(transition) => (
            <nav role="navigation" id="navigation">
              <div
                style={{
                  ...defaultStyle,
                  ...transitionStyles[transition],
                }}
                className="nav-modal">
                <button
                  className="modal__close-button modal__close-button--icon"
                  onClick={(event) => {
                    event.preventDefault();
                    handleMenuModalClose(false);
                  }}>
                  <TimesSVG />
                </button>

                <ModalLogo />

                <div className="nav-modal__walletconnect-button-container">
                  <Web3ModalButton />
                </div>
                <ul className="nav__list">
                  <li
                    onClick={() => {
                      handleMenuModalClose(false);
                    }}>
                    <NavLink to="/membership">
                      <span>Membership</span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      handleMenuModalClose(false);
                    }}>
                    <NavLink to="/governance">
                      <span>Governance</span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      handleMenuModalClose(false);
                    }}>
                    <NavLink to="/transfers">
                      <span>Transfer</span>
                    </NavLink>
                  </li>
                  <li
                    onClick={() => {
                      handleMenuModalClose(false);
                    }}>
                    <NavLink to="/tributes">
                      <span>Tribute</span>
                    </NavLink>
                  </li>
                  {/* The Profile link is available to only the connected member user (not any delegate) because the profile exists for the member account. */}
                  {isCurrentMemberConnected && (
                    <li
                      onClick={() => {
                        handleMenuModalClose(false);
                      }}>
                      <NavLink to={`/members/${account}`}>
                        <span>Profile</span>
                      </NavLink>
                    </li>
                  )}
                  {/* The Manage DAO link is available to both connected member users and connected delegate users. */}
                  {isCurrentMemberOrDelegateConnected && (
                    <li
                      onClick={() => {
                        handleMenuModalClose(false);
                      }}>
                      <NavLink to="/dao-manager">
                        <span>Manage DAO</span>
                      </NavLink>
                    </li>
                  )}
                </ul>
              </div>
            </nav>
          )}
        </Transition>
      </ReactModal>
    </>
  );
}

export default function Nav() {
  /**
   * Render
   */

  return (
    <Media query="(max-width: 62em)">
      {(_matches: boolean) => (
        <div className="nav-header">
          <div className="nav-header__menu-container">
            {/* NAV */}
            <NavLinks />
            <DaoTokenHolder border={'1px solid #c3d6dc'} />
            <NavHamburger />
            <div className="nav-header__walletconnect-button-container">
              <Web3ModalButton />
            </div>
          </div>
        </div>
      )}
    </Media>
  );
}
