import {useCallback, useEffect, useState} from 'react';
import Web3 from 'web3';

import {reverseResolveENS} from '../helpers/reverseResolveENS';
import {useWeb3Modal} from '.';

export function useENSName(): [
  state: string[],
  setState: (a: string[]) => void
] {
  /**
   * State
   */

  const [addresses, setAddresses] = useState<string[]>([]);

  const [reverseResolvedAddresses, setReverseResolvedAddresses] = useState<
    string[]
  >([]);

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const handleGetENSNamesCached = useCallback(handleGetENSNames, []);

  /**
   * Effects
   */

  useEffect(() => {
    if (!web3Instance || !addresses.length) return;

    handleGetENSNamesCached(addresses, web3Instance);
  }, [addresses, handleGetENSNamesCached, web3Instance]);

  /**
   * Functions
   */

  async function handleGetENSNames(a: string[], web3Instance: Web3) {
    try {
      setReverseResolvedAddresses(await reverseResolveENS(a, web3Instance));
    } catch (error) {
      setReverseResolvedAddresses(a);
    }
  }

  return [reverseResolvedAddresses, setAddresses];
}
