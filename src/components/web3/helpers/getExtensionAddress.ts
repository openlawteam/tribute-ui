import Web3 from 'web3';

import {ContractExtensionNames} from '../types';
import {DaoRegistry} from '../../../../abi-types/DaoRegistry';

export async function getExtensionAddress(
  extensionName: ContractExtensionNames,
  daoContractInstance: DaoRegistry | undefined
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    const extensionNameSha3 = Web3.utils.sha3(extensionName);

    if (!extensionNameSha3) {
      throw new Error('No sha3 extension name was returned.');
    }

    return await daoContractInstance.methods
      .getExtensionAddress(extensionNameSha3)
      .call();
  } catch (error) {
    throw error;
  }
}
