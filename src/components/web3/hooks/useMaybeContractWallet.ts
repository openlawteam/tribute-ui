import {provider} from 'web3-core/types';
import {useCallback, useEffect, useState} from 'react';
import {Web3Provider} from '@ethersproject/providers';

import {isPossibleContractWallet} from '../../../util/helpers';
import Web3 from 'web3';
import {useIsMounted} from '../../../hooks';

const INITIAL_MAYBE_CONTRACT_WALLET_STATE: boolean = false;

export function useMaybeContractWallet(
  account: string | undefined,
  web3Provider: Web3['currentProvider'] | undefined
): boolean {
  /**
   * State
   */

  const [maybeContractWallet, setMaybeContractWallet] = useState<boolean>(
    INITIAL_MAYBE_CONTRACT_WALLET_STATE
  );

  /**
   * Our hooks
   */

  const {isMountedRef} = useIsMounted();

  /**
   * Cached callbacks
   */

  const handleIsPossibleContractWalletCached = useCallback(
    handleIsPossibleContractWallet,
    [isMountedRef]
  );

  /**
   * Effects
   */

  useEffect(() => {
    if (!web3Provider || !account) return;

    handleIsPossibleContractWalletCached(account, web3Provider);
  }, [account, handleIsPossibleContractWalletCached, web3Provider]);

  /**
   * Functions
   */

  async function handleIsPossibleContractWallet(
    account: string,
    web3Provider: provider
  ): Promise<void> {
    try {
      const response = await isPossibleContractWallet(
        account,
        /**
         * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
         * but this does work.
         */
        new Web3Provider(web3Provider as any)
      );

      if (!isMountedRef.current) return;

      setMaybeContractWallet(response);
    } catch (error) {
      if (!isMountedRef.current) return;

      setMaybeContractWallet(INITIAL_MAYBE_CONTRACT_WALLET_STATE);
    }
  }

  /**
   * Return
   */

  return maybeContractWallet;
}
