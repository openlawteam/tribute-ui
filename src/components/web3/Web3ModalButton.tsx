import {isMobile} from 'react-device-detect';
import {useDispatch} from 'react-redux';
import {useEffect} from 'react';
import {useLocation} from 'react-router';

import {AsyncStatus} from '../../util/types';
import {connectModalClose, connectModalOpen} from '../../store/actions';
import {truncateEthAddress} from '../../util/helpers';
import {useIsDefaultChain, useMaybeContractWallet} from './hooks';
import {useWeb3Modal} from './hooks';
import {WalletIcon} from './';

type ConnectWalletButtonProps = {
  customWalletText?: string;
  showWalletETHBadge?: boolean;
};

export default function ConnectWalletButton({
  customWalletText,
  showWalletETHBadge,
}: ConnectWalletButtonProps): JSX.Element {
  /**
   * Our hooks
   */

  const {
    account,
    connected,
    initialCachedConnectorCheckStatus,
    web3Modal,
    web3Instance,
  } = useWeb3Modal();

  const {isDefaultChain} = useIsDefaultChain();

  const maybeContractWallet = useMaybeContractWallet(
    account,
    web3Instance?.currentProvider
  );

  /**
   * Their hooks
   */

  const dispatch = useDispatch();
  const {pathname} = useLocation();

  /**
   * Variables
   */

  const isWrongNetwork: boolean = isDefaultChain === false;

  /**
   * Effects
   */

  /**
   * If the `web3Modal` is ready, and/or the `pathname` changes,
   * then open or close the modal based on the current chain.
   *
   * When open, the user will be alerted to change chains.
   */
  useEffect(() => {
    if (initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED) {
      const shouldShowModalAgain: boolean =
        !isDefaultChain || maybeContractWallet ? true : false;

      shouldShowModalAgain
        ? dispatch(connectModalOpen())
        : dispatch(connectModalClose());
    }
  }, [
    dispatch,
    initialCachedConnectorCheckStatus,
    isDefaultChain,
    maybeContractWallet,
    pathname,
  ]);

  /**
   * Functions
   */

  function getWalletText(): string {
    if (isMobile) {
      if (account) {
        return truncateEthAddress(account);
      }

      return 'Connect';
    }

    if (showWalletETHBadge && account) {
      return truncateEthAddress(account);
    }

    return customWalletText || '';
  }

  /**
   * Return
   */

  return (
    <button
      className={`walletconnect__connect-button 
        ${
          isWrongNetwork && connected
            ? 'walletconnect__connect-button--error'
            : ''
        }`}
      onClick={() => {
        dispatch(connectModalOpen());
      }}>
      <span
        className={`connect-button-text ${
          connected ? 'connect-button-text--ethAddress' : ''
        }`}>
        {getWalletText() || 'Connect'}
      </span>

      {showWalletETHBadge && isWrongNetwork && connected && (
        <span>Wrong Network</span>
      )}

      {showWalletETHBadge && (
        <WalletIcon providerName={web3Modal?.cachedProvider} />
      )}
    </button>
  );
}
