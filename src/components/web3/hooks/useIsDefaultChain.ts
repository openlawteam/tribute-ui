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
  defaultChainError: string;
  isDefaultChain: boolean;
} {
  const {networkId} = useWeb3Modal();

  const [isDefaultChain, setIsDefaultChain] = useState<boolean>(false);
  const [defaultChainError, setDefaultChainError] = useState<string>('');

  useEffect(() => {
    setIsDefaultChain(networkId === DEFAULT_CHAIN);

    if (networkId !== DEFAULT_CHAIN) {
      setDefaultChainError(
        `Please connect to the ${CHAIN_NAME[DEFAULT_CHAIN]}.`
      );
    }
  }, [networkId]);

  return {
    defaultChain: DEFAULT_CHAIN,
    defaultChainError,
    isDefaultChain,
  };
}
