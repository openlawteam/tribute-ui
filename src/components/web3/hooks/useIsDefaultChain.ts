import {useEffect, useState} from 'react';

import {useWeb3Modal} from '.';
import {CHAIN_NAME, DEFAULT_CHAIN} from '../../../config';

/**
 * useIsDefaultChain
 *
 * Checks if the connected account it connected to the default chain
 * @returns {
 *  defaultChain: number,
 *  defaultChainError: string,
 *  isDefaultChain: boolean
 * }
 */
export function useIsDefaultChain(): {
  defaultChain: number;
  defaultChainError: Error | undefined;
  isDefaultChain: boolean;
} {
  /**
   * Our hooks
   */

  const {networkId, connected} = useWeb3Modal();

  /**
   * State
   */

  const [isDefaultChain, setIsDefaultChain] = useState<boolean>(false);
  const [defaultChainError, setDefaultChainError] = useState<Error>();

  /**
   * Effects
   */

  useEffect(() => {
    setIsDefaultChain(networkId === DEFAULT_CHAIN);

    if (connected && networkId !== DEFAULT_CHAIN) {
      setDefaultChainError(
        new Error(`Please connect to the ${CHAIN_NAME[DEFAULT_CHAIN]}.`)
      );

      return;
    }

    // If we make it here, reset after running checks.
    setDefaultChainError(undefined);
  }, [connected, networkId]);

  return {
    defaultChain: DEFAULT_CHAIN,
    defaultChainError,
    isDefaultChain,
  };
}
