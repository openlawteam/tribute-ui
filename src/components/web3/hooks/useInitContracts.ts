import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Web3 from 'web3';

// @todo Add inits for Transfer and Tribute when ready
import {
  initContractDaoRegistry,
  initContractOffchainVoting,
  initContractOnboarding,
} from '../../../store/actions';

import {useWeb3Modal} from '../Web3ModalManager';
import {StoreState, ReduxDispatch} from '../../../util/types';

/**
 * useInitContracts()
 *
 * Initates contracts used in the app
 */
export function useInitContracts() {
  /**
   * Selectors
   */

  const defaultChain = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );

  /**
   * Their hooks
   */

  const {web3Instance, networkId} = useWeb3Modal();
  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Cached callbacks
   */

  const initContractsCached = useCallback(initContracts, [
    defaultChain,
    dispatch,
    networkId,
    web3Instance,
  ]);

  /**
   * Functions
   */

  /**
   * Init contracts
   *
   * If we are connected to the correct network, init contracts
   */
  async function initContracts() {
    try {
      if (networkId !== defaultChain) {
        throw new Error(
          'Could not init contracts. You may be connected to the wrong chain.'
        );
      }

      // Init contracts
      await dispatch(initContractDaoRegistry(web3Instance as Web3));
      await dispatch(initContractOffchainVoting(web3Instance as Web3));
      await dispatch(initContractOnboarding(web3Instance as Web3));

      // @todo Add inits for Transfer and Tribute when ready
    } catch (error) {
      throw error;
    }
  }

  return {
    initContracts: initContractsCached,
  };
}
