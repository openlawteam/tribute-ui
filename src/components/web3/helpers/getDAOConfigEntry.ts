import Web3 from 'web3';

import {ContractDAOConfigKeys} from '../types';
import {DaoRegistry} from '../../../abis/types/DaoRegistry';

export async function getDAOConfigEntry(
  daoContractInstance: DaoRegistry | undefined,
  configKey: ContractDAOConfigKeys,
  address?: string
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    let configKeySha3 = Web3.utils.sha3(configKey);

    if (address) {
      const web3 = new Web3();

      configKeySha3 = Web3.utils.sha3(
        web3.eth.abi.encodeParameters(
          ['address', 'bytes32'],
          [address, Web3.utils.sha3(configKey)]
        )
      );
    }

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
