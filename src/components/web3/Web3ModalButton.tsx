import React, {useState} from 'react';
import {isMobile} from 'react-device-detect';

import FadeIn from '../common/FadeIn';
import Modal from '../common/Modal';
import LoaderWithEmoji from '../feedback/LoaderWithEmoji';
import {svgWalletIcon} from './WalletIcons';
import {formatEthereumAddress} from '../../util/helpers';
import {ETHERSCAN_URLS} from '../../util/config';
import {useIsDefaultChain} from '../../hooks';
import {useWeb3Modal} from './Web3ModalManager';

import TimesSVG from '../../assets/svg/TimesSVG';
import WalletSVG from '../../assets/svg/WalletSVG';

// TODO: styles in this component need to be updated (simplify and migrate
// applicable styles away from these modules)
import b from '../../assets/scss/modules/buttons.module.scss';
import m from '../../assets/scss/modules/modal.module.scss';
import s from '../../assets/scss/modules/web3modalbutton.module.scss';
import sm from '../../assets/scss/modules/sale.module.scss';

type Web3ModalButtonProps = {
  // determines whether the button is just for triggering wallet
  // modal and show the account badge
  showWalletETHBadge?: boolean;
  customWalletText?: string;
};

type ModalWrapperProps = {
  children: React.ReactNode;
};

function ModalWrapper({children}: ModalWrapperProps): JSX.Element {
  return (
    <FadeIn>
      <div className={`${sm.wrap} ${sm.gradient} ${sm.modalWrap} org-modal`}>
        <div className={`${sm.sales} ${m['modal-title']} card`}>{children}</div>
      </div>
    </FadeIn>
  );
}

type ConnectWalletProps = {
  customWalletText?: string;
  showWalletETHBadge?: boolean;
};
function ConnectWallet({
  customWalletText,
  showWalletETHBadge,
}: ConnectWalletProps): JSX.Element {
  const {
    account,
    connected,
    providerOptions,
    onConnectTo,
    onDisconnect,
    networkId,
    web3Modal,
  } = useWeb3Modal();

  const {defaultChain, defaultChainError, isDefaultChain} = useIsDefaultChain();
  const [openModal, setOpenModal] = useState<boolean>(false);

  const isWrongNetwork: boolean = networkId !== defaultChain ?? isDefaultChain;
  const displayWalletText: string | undefined = getWalletText();
  const cssConnectStyle: string = connected
    ? 'org-connection-ethaddress'
    : 'org-get-connected-text';

  function getWalletText(): string {
    if (isMobile) {
      if (account) {
        return formatEthereumAddress(account);
      } else {
        return 'Connect';
      }
    } else {
      if (showWalletETHBadge && account) {
        return formatEthereumAddress(account);
      } else {
        return customWalletText || '';
      }
    }
  }

  function handleNavigate(): void {
    window.open(`${ETHERSCAN_URLS[defaultChain]}/address/${account}`, '_blank');
  }

  function displayProviders(): JSX.Element {
    const providerOptionsFiltered = Object.entries(providerOptions).filter(
      (p) => p[0] !== 'injected'
    );
    const maybeProviderOptions = isMobile
      ? providerOptionsFiltered
      : Object.entries(providerOptions);

    const displayOptions: JSX.Element[] = maybeProviderOptions.map(
      (provider: Record<number, any>) => (
        <button
          key={provider[0]}
          className={
            connected && web3Modal?.cachedProvider === provider[0]
              ? `${s['connected']} org-connected`
              : ''
          }
          onClick={async () => await onConnectTo(provider[0])}>
          <span className={s['wallet-name']}>{provider[1].display.name}</span>

          <ProviderSVG providerName={provider[0]} />
        </button>
      )
    );

    return (
      <Modal
        keyProp={'web3modal'}
        isOpen={openModal}
        isOpenHandler={() => {
          setOpenModal(false);
        }}>
        <ModalWrapper>
          {/* MODEL CLOSE BUTTON */}
          <span
            className={`${b['modal-close']} org-modal-close`}
            onClick={() => {
              setOpenModal(false);
            }}>
            <TimesSVG />
          </span>
          <div className="org-connectors-container">
            {/* TITLE */}
            <div className="titlebar">
              <h2 className="titlebar__title org-titlebar__title">
                Connect Wallet
              </h2>
            </div>

            {/* SUBTITLE */}
            {connected && isWrongNetwork ? null : (
              <p
                className={`${s['select-wallet-instructions']} org-select-wallet-instructions`}>
                Choose Your Wallet
              </p>
            )}

            {/* CONNECTED ACCOUNT BUTTON LINK */}
            {account && (
              <button
                className={`${s['connected-address']} ${s['connected-address-link-button']} org-connected-address-link-button`}
                onClick={handleNavigate}>
                {isMobile ? formatEthereumAddress(account) : account}
              </button>
            )}

            {/* SHOW; WRONG NETWORK MSG || PROVIDER OPTIONS */}
            {connected && isWrongNetwork ? (
              <DisplayChainError defaultChainError={defaultChainError} />
            ) : (
              <div
                className={`${s['options-container']} org-options-container`}
                style={{
                  display: 'grid',
                  gridGap: '1rem',
                  gridTemplateColumns: '1fr',
                  margin: 'auto',
                }}>
                {displayOptions}
              </div>
            )}

            {/* DISCONNECT BUTTON LINK */}
            {connected && (
              <button
                className={`${s['disconnect-link-button']} org-disconnect-link-button`}
                onClick={onDisconnect}>
                {'Disconnect Wallet'}
              </button>
            )}
          </div>
        </ModalWrapper>
      </Modal>
    );
  }

  return (
    <>
      <button
        className={`${s['get-connected-btn']} ${
          s['sale-get-connected-btn']
        } org-get-connected-btn
        ${
          isWrongNetwork && connected
            ? ` ${s['error']} org-get-connected-btn--error`
            : ''
        }`}
        onClick={() => {
          setOpenModal(true);
        }}>
        {!connected && (
          <WalletSVG
            className={`${s['get-connected-icon']} org-get-connected-icon`}
          />
        )}

        <span className={`${s['connection-ethaddress']} ${cssConnectStyle}`}>
          {displayWalletText || 'Connect'}
        </span>

        {showWalletETHBadge && isWrongNetwork && connected && (
          <span>Wrong Network</span>
        )}

        {showWalletETHBadge && (
          <ProviderSVG providerName={web3Modal?.cachedProvider} />
        )}
      </button>

      {openModal && displayProviders()}
    </>
  );
}

type ProviderSVGType = {
  providerName: string;
};
function ProviderSVG({providerName}: ProviderSVGType): JSX.Element | null {
  if (!providerName) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '.5rem',
        width: '16px',
        verticalAlign: 'middle',
      }}>
      {svgWalletIcon[providerName]}
    </span>
  );
}

type DisplayChainErrorProps = {
  defaultChainError: string;
};
function DisplayChainError({
  defaultChainError,
}: DisplayChainErrorProps): JSX.Element {
  return (
    <>
      <div className="error-message">
        <small>{defaultChainError}</small>
      </div>
      <div>
        <div style={{width: '3rem', margin: '0 auto'}}>
          <LoaderWithEmoji />
        </div>
        <div>
          <small>Waiting for the right network&hellip;</small>
          <br />
          <small>Switch networks from your wallet</small>
        </div>
      </div>
    </>
  );
}

/**
 * Web3ModalButton
 * @param props: Web3ModalButtonProps
 */
export default React.memo(function Web3ModalButton({
  customWalletText,
  showWalletETHBadge,
}: Web3ModalButtonProps): JSX.Element {
  return (
    <ConnectWallet
      customWalletText={customWalletText}
      showWalletETHBadge={showWalletETHBadge}
    />
  );
});
