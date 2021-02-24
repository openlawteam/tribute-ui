import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {
  initContractDaoFactory,
  initContractBankExtension,
  initContractDaoRegistry,
  initContractManaging,
  initContractOnboarding,
  initContractConfiguration,
  initContractFinancing,
  initContractGuildKick,
  initContractRagequit,
  initContractTribute,
  initRegisteredVotingAdapter,
  initContractWithdraw,
} from '../../../store/actions';
import {ReduxDispatch, StoreState} from '../../../store/types';
import {useIsDefaultChain} from './useIsDefaultChain';
import {useWeb3Modal} from '.';

/**
 * useInitContracts()
 *
 * Initates contracts used in the app
 */
export function useInitContracts() {
  // const daoRegistryAddress = useSelector(
  //   (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  // );
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
    // daoRegistryAddress,
    isDefaultChain,
    dispatch,
    web3Instance,
  ]);

  /**
   * Init contracts
   *
   * If we are connected to the correct network, init contracts
   */
  async function initContracts() {
    try {
      if (!isDefaultChain) return;

      // Init DaoRegistry and Managing contracts first
      await dispatch(initContractDaoRegistry(web3Instance));
      await dispatch(initContractManaging(web3Instance));

      // Init more contracts
      await dispatch(initContractDaoFactory(web3Instance));
      await dispatch(initRegisteredVotingAdapter(web3Instance));
      await dispatch(initContractOnboarding(web3Instance));
      await dispatch(initContractConfiguration(web3Instance));
      await dispatch(initContractFinancing(web3Instance));
      await dispatch(initContractGuildKick(web3Instance));
      await dispatch(initContractManaging(web3Instance));
      await dispatch(initContractRagequit(web3Instance));
      await dispatch(initContractBankExtension(web3Instance));
      await dispatch(initContractTribute(web3Instance));
      await dispatch(initContractWithdraw(web3Instance));
    } catch (error) {
      throw error;
    }
  }

  return {
    initContracts: initContractsCached,
  };
}
