import {lazy, Suspense, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useEffect} from 'react';

import {connectModalClose, connectModalOpen} from './store/actions';
import {StoreState} from './store/types';
import {AsyncStatus} from './util/types';
import {useLocation} from 'react-router-dom';
import {
  useIsDefaultChain,
  useMaybeContractWallet,
  useWeb3Modal,
} from './components/web3/hooks';

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

  const {account, initialCachedConnectorCheckStatus, web3Instance} =
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
   * Render
   */

  if (!isConnectModalOpen) return null;

  return (
    <Suspense fallback={null}>
      <ConnectWalletModal modalProps={modalProps} />
    </Suspense>
  );
}
