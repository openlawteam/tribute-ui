import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {isMobile} from 'react-device-detect';

import {formatEthereumAddress} from '../../util/helpers';
import {ETHERSCAN_URLS, CHAINS} from '../../util/config';
import {StoreState} from '../../util/types';
import {useIsDefaultChain} from '../../hooks';
import {useWeb3Modal} from './Web3ModalManager';
import Modal from '../common/Modal';
import LoaderWithEmoji from '../feedback/LoaderWithEmoji';
import {svgWalletIcon} from './WalletIcons';

import TimesSVG from '../../assets/svg/TimesSVG';

type Web3ModalButtonProps = {
  // determines whether button should show account badge or custom text to
  // trigger wallet moodal
  showWalletETHBadge?: boolean;
  customWalletText?: string;
};

type ConnectWalletProps = {
  customWalletText?: string;
  showWalletETHBadge?: boolean;
};
function ConnectWallet({
  customWalletText,
  showWalletETHBadge,
}: ConnectWalletProps): JSX.Element {
  const chainId = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );

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
          className={`walletconnect__options-button 
            ${
              connected && web3Modal?.cachedProvider === provider[0]
                ? 'walletconnect__options-button--connected'
                : ''
            }`}
          onClick={async () => await onConnectTo(provider[0])}>
          <span className="wallet-name">{provider[1].display.name}</span>

          <ProviderSVG providerName={provider[0]} />
        </button>
      )
    );

    return (
      <Modal
        keyProp="web3modal"
        isOpen={openModal}
        isOpenHandler={() => {
          setOpenModal(false);
        }}>
        {/* MODEL CLOSE BUTTON */}
        <span
          className="modal__close-button"
          onClick={() => {
            setOpenModal(false);
          }}>
          <TimesSVG />
        </span>
        <div>
          {/* TITLE */}
          <div className="modal__title">Connect Wallet</div>

          {/* SUBTITLE */}
          {connected && isWrongNetwork ? null : (
            <div className="modal__subtitle">Choose Your Wallet</div>
          )}

          {/* CONNECTED ACCOUNT BUTTON LINK */}
          {account && (
            <button
              className="walletconnect__connected-address-button"
              onClick={handleNavigate}
              disabled={chainId === CHAINS.GANACHE}>
              {isMobile ? formatEthereumAddress(account) : account}
            </button>
          )}

          {/* SHOW; WRONG NETWORK MSG || PROVIDER OPTIONS */}
          {connected && isWrongNetwork ? (
            <DisplayChainError defaultChainError={defaultChainError} />
          ) : (
            <div className="walletconnect__options">{displayOptions}</div>
          )}

          {/* DISCONNECT BUTTON LINK */}
          {connected && (
            <button
              className="walletconnect__disconnect-link-button"
              onClick={onDisconnect}>
              {'Disconnect Wallet'}
            </button>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <>
      <button
        className={`walletconnect__connect-button 
        ${
          isWrongNetwork && connected
            ? 'walletconnect__connect-button--error'
            : ''
        }`}
        onClick={() => {
          setOpenModal(true);
        }}>
        <span
          className={`connect-button-text ${
            connected ? 'connect-button-text--ethAddress' : ''
          }`}>
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
    <span className="walletconnect__wallet-icon">
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
