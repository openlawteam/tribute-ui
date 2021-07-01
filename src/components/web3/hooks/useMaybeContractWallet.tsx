import {provider} from 'web3-core/types';
import {useEffect, useState} from 'react';
import {Web3Provider} from '@ethersproject/providers';
import usePrevious from 'react-use/lib/usePrevious';

import {AsyncStatus} from '../../../util/types';
import {isPossibleContractWallet} from '../../../util/helpers';
import {useWeb3Modal} from './useWeb3Modal';

const INITIAL_MAYBE_CONTRACT_WALLET_STATE: boolean = false;

export function useMaybeContractWallet(): boolean {
  /**
   * State
   */

  const [maybeContractWallet, setMaybeContractWallet] = useState<boolean>(
    INITIAL_MAYBE_CONTRACT_WALLET_STATE
  );

  /**
   * Our hooks
   */

  const {account, initialCachedConnectorCheckStatus, web3Instance} =
    useWeb3Modal();

  /**
   * Their hooks
   */

  const previousAccount = usePrevious<string | undefined>(account);

  /**
   * Effects
   */

  useEffect(() => {
    if (
      web3Instance?.currentProvider &&
      account &&
      initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED &&
      previousAccount !== account
    ) {
      handleIsPossibleContractWallet(account, web3Instance.currentProvider);
    }
  }, [
    account,
    initialCachedConnectorCheckStatus,
    maybeContractWallet,
    previousAccount,
    web3Instance?.currentProvider,
  ]);

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

      setMaybeContractWallet(response);
    } catch (error) {
      setMaybeContractWallet(INITIAL_MAYBE_CONTRACT_WALLET_STATE);
    }
  }

  /**
   * Return
   */

  return maybeContractWallet;
}
