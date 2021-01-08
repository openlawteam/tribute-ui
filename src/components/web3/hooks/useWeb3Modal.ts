import {useContext} from 'react';

import {Web3ModalContextValue, Web3ModalContext} from '../Web3ModalManager';

/**
 * useWeb3Modal(): Web3ModalContextValue
 *
 * Internal hook to access wallet connectivity and connected state.
 *
 * @example
 * const {account, connected, networkId, ...} = useWeb3Modal();
 */
export function useWeb3Modal(): Web3ModalContextValue {
  return useContext(Web3ModalContext);
}
