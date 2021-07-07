import {lazy, Suspense, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useEffect} from 'react';

import {connectModalClose} from './store/actions';
import {StoreState} from './store/types';

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
   * Their hooks
   */

  const dispatch = useDispatch();

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
   * Effects
   */

  useEffect(() => {
    setModalProps((prevState) => ({...prevState, isOpen: isConnectModalOpen}));
  }, [isConnectModalOpen]);

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
