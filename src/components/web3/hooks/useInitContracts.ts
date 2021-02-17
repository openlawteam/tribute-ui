import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

// @todo Add inits for Transfer and Tribute when ready
import {
  initContractBankExtension,
  initContractDaoRegistry,
  initContractVoting,
  initContractOnboarding,
} from '../../../store/actions';
import {ReduxDispatch} from '../../../store/types';
import {useIsDefaultChain} from './useIsDefaultChain';
import {useWeb3Modal} from '.';

/**
 * useInitContracts()
 *
 * Initates contracts used in the app
 */
export function useInitContracts() {
  /**
   * Their hooks
   */

  const {isDefaultChain} = useIsDefaultChain();
  const {web3Instance} = useWeb3Modal();
  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Cached callbacks
   */

  const initContractsCached = useCallback(initContracts, [
    isDefaultChain,
    dispatch,
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
      if (!isDefaultChain) return;

      // Init contracts
      await dispatch(initContractDaoRegistry(web3Instance));
      await dispatch(initContractVoting(web3Instance));
      await dispatch(initContractOnboarding(web3Instance));
      await dispatch(initContractBankExtension(web3Instance));

      // @todo Add inits for Transfer and Tribute when ready
    } catch (error) {
      throw error;
    }
  }

  return {
    initContracts: initContractsCached,
  };
}
