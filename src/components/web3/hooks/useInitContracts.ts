import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {
  initContractBankExtension,
  initContractDaoRegistry,
  initContractManaging,
  initContractOnboarding,
  initContractTribute,
  initRegisteredVotingAdapter,
} from '../../../store/actions';
import {ReduxDispatch} from '../../../store/types';
import {useIsDefaultChain} from './useIsDefaultChain';
import {useWeb3Modal} from '.';

/**
 * useInitContracts
 *
 * Initiates all contracts used in the app.
 *
 * @todo Use subgraph to pass the address to each init function, so it skips chain calls.
 */
export function useInitContracts(): () => Promise<void> {
  /**
   * Our hooks
   */

  const {isDefaultChain} = useIsDefaultChain();
  const {web3Instance} = useWeb3Modal();

  /**
   * Their hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Cached callbacks
   */

  const initContractsCached = useCallback(initContracts, [
    dispatch,
    isDefaultChain,
    web3Instance,
  ]);

  /**
   * Functions
   */

  /**
   * Init contracts
   */
  async function initContracts() {
    try {
      if (!isDefaultChain) return;

      // Must init registry first
      await dispatch(initContractDaoRegistry(web3Instance));
      // Must be init before voting
      await dispatch(initContractManaging(web3Instance));

      // Init other contracts
      await dispatch(initRegisteredVotingAdapter(web3Instance));
      await dispatch(initContractOnboarding(web3Instance));
      await dispatch(initContractBankExtension(web3Instance));
      await dispatch(initContractTribute(web3Instance));
    } catch (error) {
      throw error;
    }
  }

  return initContractsCached;
}
