import {isMobile} from 'react-device-detect';
import {useDispatch} from 'react-redux';

import {connectModalOpen} from '../../store/actions';
import {truncateEthAddress} from '../../util/helpers';
import {useIsDefaultChain} from './hooks';
import {useWeb3Modal} from './hooks';
import {WalletIcon} from './';

type CustomWalletTextProps = {
  account: ReturnType<typeof useWeb3Modal>['account'];
  connected: ReturnType<typeof useWeb3Modal>['connected'];
  isMobile: typeof isMobile;
};

type ConnectWalletButtonProps = {
  customWalletText?: ((o: CustomWalletTextProps) => string) | string;
  showWalletETHBadge?: boolean;
};

export default function ConnectWalletButton({
  customWalletText,
  // Defaults to `true`
  showWalletETHBadge = true,
}: ConnectWalletButtonProps): JSX.Element {
  /**
   * Our hooks
   */

  const {account, connected, web3Modal} = useWeb3Modal();

  const {isDefaultChain} = useIsDefaultChain();

  /**
   * Their hooks
   */

  const dispatch = useDispatch();

  /**
   * Variables
   */

  const isWrongNetwork: boolean = isDefaultChain === false;

  /**
   * Functions
   */

  function getWalletText(): string {
    if (customWalletText) {
      return typeof customWalletText === 'function'
        ? customWalletText({account, connected, isMobile})
        : customWalletText;
    }

    if (account) {
      return truncateEthAddress(account);
    }

    return 'Connect';
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
        {getWalletText()}
      </span>

      {isWrongNetwork && connected && <span>Wrong Network</span>}

      {showWalletETHBadge && (
        <WalletIcon providerName={web3Modal?.cachedProvider} />
      )}
    </button>
  );
}
