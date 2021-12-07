import {useCallback, useEffect, useState} from 'react';
import Web3 from 'web3';

import {reverseResolveENS} from '../helpers';

/**
 * A hook to reverse resolve ENS addresses by setting
 * the addresses, using the returned callback, and then receving
 * the response.
 *
 * @param web3Instance `Web3`
 * @returns `[state: string[], setState: (a: string[]) => void]`
 */
export function useENSName(
  web3Instance: Web3 | undefined
): [state: string[], setState: (a: string[]) => void] {
  /**
   * State
   */

  const [addresses, setAddresses] = useState<string[]>([]);

  const [reverseResolvedAddresses, setReverseResolvedAddresses] = useState<
    string[]
  >([]);

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
