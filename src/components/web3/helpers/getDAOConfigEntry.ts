import Web3 from 'web3';

import {ContractDAOConfigKeys} from '../types';
import {DaoRegistry} from '../../../../abi-types/DaoRegistry';

export async function getDAOConfigEntry(
  configKey: ContractDAOConfigKeys,
  daoContractInstance: DaoRegistry | undefined
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    const configKeySha3 = Web3.utils.sha3(configKey);

    if (!configKeySha3) {
      throw new Error('No sha3 config key was returned.');
    }

    return await daoContractInstance.methods
      .getConfiguration(configKeySha3)
      .call();
  } catch (error) {
    throw error;
  }
}
