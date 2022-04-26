import {isMobile} from '@walletconnect/browser-utils';
import {Link, useLocation} from 'react-router-dom';
import {useEffect} from 'react';
import {usePrevious} from 'react-use';
import {useSelector} from 'react-redux';

import {CHAINS} from '../../config';
import {CopyWithTooltip} from '../common/CopyWithTooltip';
import {CycleEllipsis} from '../feedback';
import {StoreState} from '../../store/types';
import {useIsDefaultChain} from './hooks';
import {useWeb3Modal} from './hooks';
import {WalletIcon} from '.';
import LoaderLarge from '../feedback/LoaderLarge';
import Modal from '../common/Modal';
import TimesSVG from '../../assets/svg/TimesSVG';

type ConnectWalletModalProps = {
  modalProps: {
    isOpen: Parameters<typeof Modal>[0]['isOpen'];
    onRequestClose: () => void;
  } & Partial<Parameters<typeof Modal>[0]>;
  // @todo Look into more generic way to render errors in the modal
  maybeContractWallet?: boolean;
};

export default function ConnectWalletModal(
  props: ConnectWalletModalProps
): JSX.Element {
  const {
    modalProps: {isOpen, onRequestClose, ...restModalProps},
    maybeContractWallet = false,
  } = props;

  /**
   * Selectors
   */

  const isActiveMember: boolean = useSelector(
    ({connectedMember}: StoreState) => connectedMember?.isActiveMember === true
  );

  const connectedMemberAddress = useSelector(
    ({connectedMember}: StoreState) => connectedMember?.memberAddress
  );

  /**
   * Our hooks
   */

  const {
    // @todo Use and handle error in the UI
    // error,
    account,
    accountENS,
    connected,
    connectWeb3Modal,
    disconnectWeb3Modal,
    networkId,
    providerOptions,
    web3Modal,
  } = useWeb3Modal();

  const {defaultChainError, isDefaultChain} = useIsDefaultChain();

  /**
   * Their hooks
   */

  const {pathname} = useLocation();
  const previousPathname = usePrevious<string>(pathname);

  /**
   * Variables
   */

  const isWrongNetwork: boolean = isDefaultChain === false;
  const isChainGanache = networkId === CHAINS.GANACHE;
  const memberProfilePath: string = `/members/${connectedMemberAddress}`;

  const displayOptions: JSX.Element[] = Object.entries(providerOptions)
    // If mobile, filter-out `"injected"`
    .filter(([type]) => (isMobile() ? type !== 'injected' : true))
    .map((provider: Record<number, any>) => {
      const isButtonDisabled: boolean =
        isChainGanache && provider[0] === 'walletconnect';

      return (
        <button
          aria-label={`Connect to ${provider[1].display.name}`}
          key={provider[0]}
          className={`walletconnect__options-button 
            ${
              connected && web3Modal?.cachedProvider === provider[0]
                ? 'walletconnect__options-button--connected'
                : ''
            }`}
          onClick={() =>
            isButtonDisabled ? () => {} : connectWeb3Modal(provider[0])
          }
          // disable WalletConnect button on Ganache network
          disabled={isButtonDisabled}>
          <span className="wallet-name">{provider[1].display.name}</span>

          <WalletIcon providerName={provider[0]} />
        </button>
      );
    });

  /**
   * Effects
   */

  /**
   * Automatically trigger the modal to close if we navigated from the
   * "set a delegate" link in this component to the `memberProfilePath`.
   */
  useEffect(() => {
    if (
      isOpen &&
      pathname === memberProfilePath &&
      previousPathname &&
      previousPathname !== memberProfilePath
    ) {
      // Run last in the queue, as it completes quicker than the global "open modal" action.
      setTimeout(onRequestClose, 0);
    }
  }, [isOpen, memberProfilePath, onRequestClose, pathname, previousPathname]);

  /**
   * Functions
   */

  function getContractWalletWarningText(): JSX.Element | null {
    if (!connected || !maybeContractWallet || isWrongNetwork) {
      return null;
    }

    const maybeMemberText: JSX.Element | null = isActiveMember ? (
      <>
        As a member, you can{' '}
        <Link onClick={handleSetDelegateClicked} to={memberProfilePath}>
          set a delegate
        </Link>{' '}
        to a key-based wallet, like MetaMask.
      </>
    ) : null;

    return (
      <p>
        <small>
          Smart contract wallets are not generally supported for features like
          off-chain voting. {maybeMemberText}
        </small>
      </p>
    );
  }

  /**
   * Allow the modal to close if the previous path was already equal to
   * `memberProfilePath` (e.g. navigated to it normally, loaded cold from brower)
   */
  function handleSetDelegateClicked() {
    if (isOpen && previousPathname && previousPathname === memberProfilePath) {
      onRequestClose();
    }
  }

  return (
    <Modal
      keyProp="connectWalletModal"
      isOpen={isOpen}
      isOpenHandler={onRequestClose}
      {...restModalProps}>
      {/* MODEL CLOSE BUTTON */}
      <span
        className="modal__close-button"
        onClick={() => {
          onRequestClose();
        }}>
        <TimesSVG />
      </span>

      <div>
        {/* TITLE */}
        <div className="modal__title">Connect Wallet</div>

        {/* SUBTITLE */}
        {(!connected || !isWrongNetwork) && (
          <div className="modal__subtitle">Choose your wallet 😎</div>
        )}

        {/* POSSIBLE CONTRACT WALLET WARNING TEXT */}
        {getContractWalletWarningText()}

        {/* SHOW; WRONG NETWORK MSG || PROVIDER OPTIONS */}
        {connected && isWrongNetwork && (
          <>
            <div className="error-message">
              <small>{defaultChainError?.message || ''}</small>
            </div>

            <div className="loader--large-container">
              <LoaderLarge />
            </div>

            <div>
              <small>Waiting for the right network</small>
              <CycleEllipsis />
              <br />
              <small>Switch networks from your wallet.</small>
            </div>
          </>
        )}

        {/* CONNECTED ACCOUNT TEXT */}
        {account && (
          <div className="walletconnect__connected-address">
            <CopyWithTooltip
              render={({elementRef, isCopied, setCopied, tooltipID}) => (
                <span
                  className="walletconnect__connected-address-text"
                  data-for={tooltipID}
                  data-tip={
                    isCopied
                      ? 'copied!'
                      : accountENS
                      ? `${accountENS} (${account})`
                      : 'copy'
                  }
                  onClick={setCopied}
                  ref={elementRef}>
                  {accountENS || account}
                </span>
              )}
              textToCopy={account}
            />
          </div>
        )}

        {(!connected || !isWrongNetwork) && (
          <div className="walletconnect__options">{displayOptions}</div>
        )}

        {/* DISCONNECT BUTTON LINK */}
        {connected && (
          <button
            className="walletconnect__disconnect-link-button"
            onClick={disconnectWeb3Modal}>
            {'Disconnect Wallet'}
          </button>
        )}
      </div>
    </Modal>
  );
}
