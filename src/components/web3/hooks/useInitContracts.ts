import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Web3 from 'web3';

import {
  initContractDaoRegistry,
  initContractFinancing,
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
  const {web3Instance, networkId} = useWeb3Modal();

  const defaultChain = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );

  const dispatch = useDispatch();
  const reduxDispatch = useDispatch<ReduxDispatch>();

  const initContractsCached = useCallback(initContracts, [
    dispatch,
    networkId,
    defaultChain,
    reduxDispatch,
    web3Instance,
  ]);

  /**
   * Init contracts
   *
   * If we are connected to the correct network, init contracts
   */
  function initContracts() {
    try {
      // only if connected to the default chain; init contracts
      if (networkId === defaultChain) {
        // init contracts
        reduxDispatch(initContractDaoRegistry(web3Instance as Web3))
          .then(() => dispatch(initContractFinancing(web3Instance as Web3)))
          .then(() =>
            dispatch(initContractOffchainVoting(web3Instance as Web3))
          )
          .then(() => dispatch(initContractOnboarding(web3Instance as Web3)));
      }
    } catch (error) {
      throw error;
    }
  }

  return {
    initContracts: initContractsCached,
  };
}
