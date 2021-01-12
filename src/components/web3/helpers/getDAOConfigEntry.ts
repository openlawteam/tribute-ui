import Web3 from 'web3';

import {ContractDAOConfigKeys, SmartContractItem} from '../types';

export async function getDAOConfigEntry(
  configKey: ContractDAOConfigKeys,
  daoContractInstance: SmartContractItem['instance'] | undefined
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    return await daoContractInstance.methods
      .getConfiguration(Web3.utils.sha3(configKey))
      .call();
  } catch (error) {
    throw error;
  }
}
