import {lazy, Suspense, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useEffect} from 'react';

import {
  useIsDefaultChain,
  useMaybeContractWallet,
  useWeb3Modal,
} from './components/web3/hooks';
import {AsyncStatus} from './util/types';
import {connectModalClose, connectModalOpen} from './store/actions';
import {StoreState} from './store/types';
import {useLocation} from 'react-router-dom';

/**
 * Lazy load ConnectWalletModal only when open
 */
const ConnectWalletModal = lazy(
  () => import('./components/web3/ConnectWalletModal')
);

export default function GlobalConnectWalletModal() {
  /**
   * Selectors
   */

  const isConnectModalOpen: boolean = useSelector(
    ({connectModal}: StoreState) => connectModal.isOpen
  );

  /**
   * State
   */

  const [modalProps, setModalProps] = useState<
    Parameters<typeof ConnectWalletModal>[0]['modalProps']
  >({
    isOpen: isConnectModalOpen,
    onRequestClose: () => {
      dispatch(connectModalClose());
    },
  });

  /**
   * Our hooks
   */

  const {account, connected, initialCachedConnectorCheckStatus, web3Instance} =
    useWeb3Modal();

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
   * Effects
   */

  useEffect(() => {
    setModalProps((prevState) => ({...prevState, isOpen: isConnectModalOpen}));
  }, [isConnectModalOpen]);

  /**
   * Effects
   */

  /**
   * Will automatically re-show the modal (on app `pathname` change) only when:
   *  - If wrong chain
   *  - If smart contract wallet
   */
  useEffect(() => {
    if (initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED) {
      const shouldAutomaticallyOpenModal: boolean =
        connected && (!isDefaultChain || maybeContractWallet) ? true : false;

      shouldAutomaticallyOpenModal
        ? dispatch(connectModalOpen())
        : dispatch(connectModalClose());
    }
  }, [
    connected,
    dispatch,
    initialCachedConnectorCheckStatus,
    isDefaultChain,
    maybeContractWallet,
    pathname,
  ]);

  /**
   * Render
   */

  if (!isConnectModalOpen) return null;

  return (
    <Suspense fallback={null}>
      <ConnectWalletModal
        // @todo Look into more generic way to render errors in the modal
        maybeContractWallet={maybeContractWallet}
        modalProps={modalProps}
      />
    </Suspense>
  );
}
