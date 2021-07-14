import {AbiItem} from 'web3-utils/types';
import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Web3 from 'web3';

import {ContractDAOConfigKeys} from '../components/web3/types';
import {multicall, MulticallTuple} from '../components/web3/helpers';
import {StoreState} from '../store/types';
import {useWeb3Modal} from '../components/web3/hooks';
import {AsyncStatus} from '../util/types';

type ConfigEntriesReturn = {
  daoConfigurations: string[];
  daoConfigurationsError: Error | undefined;
  daoConfigurationsStatus: AsyncStatus;
};

const INITIAL_CONFIG_ENTRIES: ConfigEntriesReturn['daoConfigurations'] = [];

export function useDaoConfigurations(
  /**
   * The keys of any configuration settings to get from the DAO.
   */
  configKeys: ContractDAOConfigKeys[]
): ConfigEntriesReturn {
  /**
   * Selectors
   */

  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  const daoRegistryABI = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  );

  /**
   * State
   */

  const [daoConfigurations, setDaoConfigurations] = useState<
    ConfigEntriesReturn['daoConfigurations']
  >(INITIAL_CONFIG_ENTRIES);

  const [daoConfigurationsStatus, setDaoConfigurationsStatus] = useState<
    ConfigEntriesReturn['daoConfigurationsStatus']
  >(AsyncStatus.STANDBY);

  const [daoConfigurationsError, setDaoConfigurationsError] =
    useState<ConfigEntriesReturn['daoConfigurationsError']>();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Variables
   */

  const getConfigurationABI = daoRegistryABI?.find(
    (ai) => ai.name === 'getConfiguration'
  );

  /**
   * Effects
   */

  // Handle getting the configurations
  useEffect(() => {
    if (!daoRegistryAddress || !getConfigurationABI || !web3Instance) {
      return;
    }

    handleGetConfigurations({
      abi: getConfigurationABI,
      configKeys,
      contractAddress: daoRegistryAddress,
      web3Instance,
    });
  }, [configKeys, daoRegistryAddress, getConfigurationABI, web3Instance]);

  /**
   * Functions
   */

  async function handleGetConfigurations({
    abi,
    configKeys,
    contractAddress,
    web3Instance,
  }: {
    configKeys: ContractDAOConfigKeys[];
    contractAddress: string;
    abi: AbiItem;
    web3Instance: Web3;
  }) {
    try {
      const calls: MulticallTuple[] = configKeys.map((ck) => [
        contractAddress,
        abi,
        [web3Instance.utils.sha3(ck) || ''],
      ]);

      setDaoConfigurationsError(undefined);
      setDaoConfigurationsStatus(AsyncStatus.PENDING);

      setDaoConfigurations(await multicall({calls, web3Instance}));

      setDaoConfigurationsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setDaoConfigurations(INITIAL_CONFIG_ENTRIES);
      setDaoConfigurationsStatus(AsyncStatus.REJECTED);
      setDaoConfigurationsError(error);
    }
  }

  return {
    daoConfigurations,
    daoConfigurationsError,
    daoConfigurationsStatus,
  };
}
