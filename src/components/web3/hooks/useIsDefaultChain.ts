import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {useWeb3Modal} from '.';
import {CHAIN_NAME} from '../../../config';
import {StoreState} from '../../../util/types';

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
  const defaultChain = useSelector(
    (state: StoreState) => state.blockchain.defaultChain
  );

  const [isDefaultChain, setIsDefaultChain] = useState<boolean>(false);
  const [defaultChainError, setDefaultChainError] = useState<string>('');

  useEffect(() => {
    setIsDefaultChain(networkId === defaultChain);

    if (networkId !== defaultChain) {
      setDefaultChainError(
        `Please connect to the ${CHAIN_NAME[defaultChain]}.`
      );
    }
  }, [networkId, defaultChain]);

  return {
    defaultChain,
    defaultChainError,
    isDefaultChain,
  };
}
