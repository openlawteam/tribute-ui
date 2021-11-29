import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import Web3 from 'web3';

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
  initContractNFTExtension,
  initContractOnboarding,
  initContractRagequit,
  initContractTribute,
  initContractTributeNFT,
  initRegisteredVotingAdapter,
} from '../../../store/actions';
import {ReduxDispatch} from '../../../store/types';

/**
 * useInitContracts
 *
 * Initiates all contracts used in the app.
 *
 * @todo Use subgraph to pass the address to each init function, so it skips chain calls.
 */
export function useInitContracts(): (data: {
  web3Instance: Web3;
}) => Promise<void> {
  /**
   * Their hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Cached callbacks
   */

  const initContractsCached = useCallback(initContracts, [dispatch]);

  /**
   * Init contracts
   */
  async function initContracts({web3Instance}: {web3Instance: Web3}) {
    try {
      // Must init registry first
      await dispatch(initContractDaoRegistry(web3Instance));

      await dispatch(initContractDaoFactory(web3Instance));
      await dispatch(initContractBankFactory(web3Instance));
      await dispatch(initContractConfiguration(web3Instance));
      await dispatch(initContractFinancing(web3Instance));
      await dispatch(initContractGuildKick(web3Instance));
      await dispatch(initContractManaging(web3Instance));
      await dispatch(initContractRagequit(web3Instance));
      await dispatch(initContractBankAdapter(web3Instance));
      await dispatch(initContractBankExtension(web3Instance));
      await dispatch(initContractOnboarding(web3Instance));
      await dispatch(initContractTribute(web3Instance));
      await dispatch(initContractDistribute(web3Instance));
      await dispatch(initRegisteredVotingAdapter(web3Instance));
      await dispatch(initContractTributeNFT(web3Instance));
      await dispatch(initContractNFTExtension(web3Instance));
      await dispatch(initContractCouponOnboarding(web3Instance));
      await dispatch(initContractDaoRegistryAdapter(web3Instance));
      await dispatch(initContractERC20Extension(web3Instance));
    } catch (error) {
      throw error;
    }
  }

  return initContractsCached;
}
