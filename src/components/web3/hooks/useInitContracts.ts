import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {
  initContractBankAdapter,
  initContractBankExtension,
  initContractBankFactory,
  initContractConfiguration,
  initContractCouponOnboarding,
  initContractDaoFactory,
  initContractDaoRegistry,
  initContractDaoRegistryAdapter,
  initContractDistribute,
  initContractERC20Extension,
  initContractFinancing,
  initContractGuildKick,
  initContractManaging,
  initContractNFTAdapter,
  initContractNFTExtension,
  initContractOnboarding,
  initContractRagequit,
  initContractTribute,
  initContractTributeNFT,
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
   * Init contracts
   */
  async function initContracts() {
    try {
      if (!isDefaultChain || !web3Instance) return;

      // Must init registry first
      await dispatch(initContractDaoRegistry(web3Instance));

      // Init more contracts
      await dispatch(initContractDaoFactory(web3Instance));
      await dispatch(initContractBankFactory(web3Instance));
      await dispatch(initContractConfiguration(web3Instance));
      await dispatch(initContractFinancing(web3Instance));
      await dispatch(initContractGuildKick(web3Instance));
      await dispatch(initContractManaging(web3Instance));
      await dispatch(initContractRagequit(web3Instance));
      await dispatch(initContractBankAdapter(web3Instance));
      // Init other contracts
      await dispatch(initContractBankExtension(web3Instance));
      await dispatch(initContractManaging(web3Instance));
      await dispatch(initContractOnboarding(web3Instance));
      await dispatch(initContractTribute(web3Instance));
      await dispatch(initContractDistribute(web3Instance));
      await dispatch(initRegisteredVotingAdapter(web3Instance));
      await dispatch(initContractTributeNFT(web3Instance));
      await dispatch(initContractNFTExtension(web3Instance));
      await dispatch(initContractNFTAdapter(web3Instance));
      await dispatch(initContractCouponOnboarding(web3Instance));
      await dispatch(initContractDaoRegistryAdapter(web3Instance));
      await dispatch(initContractERC20Extension(web3Instance));
    } catch (error) {
      throw error;
    }
  }

  return initContractsCached;
}
