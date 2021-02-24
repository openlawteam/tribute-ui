import Web3 from 'web3';
import {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {
  initContractBankExtension,
  initContractDaoRegistry,
  initContractManaging,
  initContractOnboarding,
  initContractTribute,
  initRegisteredVotingAdapter,
} from '../../../store/actions';
import {AsyncStatus} from '../../../util/types';
import {ContractAdapterNames, ContractExtensionNames} from '../types';
import {multicall, MulticallTuple} from '../helpers';
import {
  ContractsStateEntry,
  ReduxDispatch,
  StoreState,
} from '../../../store/types';
import {useIsDefaultChain} from './useIsDefaultChain';
import {useWeb3Modal} from '.';

type ContractAddresses = Partial<
  Record<ContractAdapterNames | ContractExtensionNames, string>
>;

type UseInitContractsReturn = {
  contractsFetchStatus: AsyncStatus;
  initContracts: () => Promise<void>;
};

/**
 * useInitContracts()
 *
 * Initates contracts used in the app
 */
export function useInitContracts(): UseInitContractsReturn {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

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
   * State
   */

  const [
    contractAddresses,
    setContractAddresses,
  ] = useState<ContractAddresses>();

  const [contractsFetchStatus, setContractsFetchStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Cached callbacks
   */

  const initContractsCached = useCallback(initContracts, [
    isDefaultChain,
    daoRegistryContract,
    dispatch,
    web3Instance,
    contractAddresses,
  ]);

  const getABIItemHelperCached = useCallback(getABIItemHelper, []);

  /**
   * Effects
   */

  useEffect(() => {
    if (!web3Instance) return;

    dispatch(initContractDaoRegistry(web3Instance));
  }, [dispatch, web3Instance]);

  // Call the chain to get all contract addresses, if subgraph is not available.
  useEffect(() => {
    // @todo Check if subgraph query is loaded and back out
    // if (queryLoading && queryData) return;

    if (!web3Instance) return;
    if (!daoRegistryContract) return;

    const getCall = getABIItemHelperCached(daoRegistryContract);

    setContractsFetchStatus(AsyncStatus.PENDING);

    multicall({
      calls: [
        getCall('getAdapterAddress', ContractAdapterNames.managing),
        getCall('getAdapterAddress', ContractAdapterNames.voting),
        getCall('getAdapterAddress', ContractAdapterNames.onboarding),
        getCall('getExtensionAddress', ContractExtensionNames.bank),
        getCall('getAdapterAddress', ContractAdapterNames.tribute),
      ],
      web3Instance,
    })
      .then(([managing, voting, onboarding, bank, tribute]) => {
        setContractsFetchStatus(AsyncStatus.FULFILLED);

        setContractAddresses((prevState) => ({
          ...prevState,
          managing,
          voting,
          onboarding,
          bank,
          tribute,
        }));
      })
      .catch(() => {
        setContractsFetchStatus(AsyncStatus.REJECTED);
        setContractAddresses(undefined);
      });
  }, [daoRegistryContract, getABIItemHelperCached, web3Instance]);

  /**
   * Functions
   */

  /**
   * Init contracts
   */
  async function initContracts() {
    try {
      if (!isDefaultChain || !daoRegistryContract || !contractAddresses) return;

      // Must be init before voting
      await dispatch(
        initContractManaging(web3Instance, contractAddresses?.managing)
      );

      // Init other contracts
      await dispatch(
        initRegisteredVotingAdapter(web3Instance, contractAddresses?.voting)
      );
      await dispatch(
        initContractOnboarding(web3Instance, contractAddresses?.onboarding)
      );

      await dispatch(
        initContractBankExtension(web3Instance, contractAddresses?.bank)
      );
      await dispatch(
        initContractTribute(web3Instance, contractAddresses?.tribute)
      );
    } catch (error) {
      throw error;
    }
  }

  function getABIItemHelper(daoRegistryContract: ContractsStateEntry) {
    return (
      functionName: string,
      contractOrExtensionName: ContractAdapterNames | ContractExtensionNames
    ): MulticallTuple => {
      const [abiItem] = daoRegistryContract.abi.filter(
        (item) => item.name === functionName
      );

      return [
        daoRegistryContract.contractAddress,
        abiItem,
        [Web3.utils.sha3(contractOrExtensionName) || ''],
      ];
    };
  }

  return {
    contractsFetchStatus,
    initContracts: initContractsCached,
  };
}
