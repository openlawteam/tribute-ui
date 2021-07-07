import {isMobile} from 'react-device-detect';
import {Link} from 'react-router-dom';
import {useSelector} from 'react-redux';

import {CHAINS} from '../../config';
import {CycleEllipsis} from '../feedback';
import {StoreState} from '../../store/types';
import {truncateEthAddress} from '../../util/helpers';
import {useIsDefaultChain, useMaybeContractWallet} from './hooks';
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
};

export default function ConnectWalletModal(
  props: ConnectWalletModalProps
): JSX.Element {
  const {
    modalProps: {isOpen, onRequestClose, ...restModalProps},
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
    connected,
    connectWeb3Modal,
    disconnectWeb3Modal,
    networkId,
    providerOptions,
    web3Modal,
    web3Instance,
  } = useWeb3Modal();

  const {defaultChainError, isDefaultChain} = useIsDefaultChain();

  const maybeContractWallet = useMaybeContractWallet(
    account,
    web3Instance?.currentProvider
  );

  /**
   * Variables
   */

  const isWrongNetwork: boolean = isDefaultChain === false;
  const isChainGanache = networkId === CHAINS.GANACHE;

  const displayOptions: JSX.Element[] = Object.entries(providerOptions)
    // If mobile, filter-out `"injected"`
    .filter(([type]) => (isMobile ? type !== 'injected' : true))
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
   * Functions
   */

  function getContractWalletWarningText(): JSX.Element | null {
    if (!connected || !maybeContractWallet || isWrongNetwork) {
      return null;
    }

    const maybeMemberText: JSX.Element | null = isActiveMember ? (
      <>
        As a member, you can{' '}
        <Link to={`/members/${connectedMemberAddress}`}>set a delegate</Link> to
        a key-based wallet, like MetaMask.
      </>
    ) : null;

    return (
      <p className="error-message" style={{}}>
        <small>
          Smart contract wallets are not currently supported. {maybeMemberText}
        </small>
      </p>
    );
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
          <div className="modal__subtitle">Choose your wallet</div>
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
          <div>
            <span className="walletconnect__connected-address-text">
              {truncateEthAddress(account, 7)}
            </span>
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
