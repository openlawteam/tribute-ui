import {useEffect, useState} from 'react';

import {CHAIN_NAME_FULL, DEFAULT_CHAIN} from '../../../config';
import {useWeb3Modal} from './useWeb3Modal';

type UseIsDefaultChainReturn = {
  /**
   * The default chain of the app
   */
  defaultChain: number;
  /**
   * Any error derived from detecting the default chain
   */
  defaultChainError: Error | undefined;
  /**
   * Specifies if the curently connected chain matches the app's default chain
   */
  isDefaultChain: boolean;
};

/**
 * useIsDefaultChain
 *
 * Checks if the connected account it connected to the default chain.
 *
 * @returns UseIsDefaultChainReturn
 */
export function useIsDefaultChain(): UseIsDefaultChainReturn {
  /**
   * Our hooks
   */

  const {networkId, connected} = useWeb3Modal();

  /**
   * State
   */

  const [defaultChainError, setDefaultChainError] = useState<Error>();

  /**
   * Effects
   */

  // Determine `defaultChainError`
  useEffect(() => {
    // User is already connected to a wallet, and chain is incorrect.
    if (connected && networkId !== DEFAULT_CHAIN) {
      setDefaultChainError(
        new Error(`Please connect to the ${CHAIN_NAME_FULL[DEFAULT_CHAIN]}.`)
      );

      return;
    }

    // Reset error after successful checks.
    setDefaultChainError(undefined);
  }, [connected, networkId]);

  return {
    defaultChain: DEFAULT_CHAIN,
    defaultChainError,
    isDefaultChain: networkId === DEFAULT_CHAIN,
  };
}
