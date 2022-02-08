import {isMobile} from '@walletconnect/browser-utils';
import {useDispatch} from 'react-redux';
import {toChecksumAddress} from 'web3-utils';

import {connectModalOpen} from '../../store/actions';
import {truncateEthAddress} from '../../util/helpers';
import {useIsDefaultChain} from './hooks';
import {useWeb3Modal} from './hooks';
import {WalletIcon} from './';

type CustomWalletTextProps = {
  account: ReturnType<typeof useWeb3Modal>['account'];
  connected: ReturnType<typeof useWeb3Modal>['connected'];
  isMobile: ReturnType<typeof isMobile>;
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

  const {account, accountENS, connected, web3Modal} = useWeb3Modal();
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
        ? customWalletText({account, connected, isMobile: isMobile()})
        : customWalletText;
    }

    if (account) {
      return accountENS || truncateEthAddress(toChecksumAddress(account));
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
