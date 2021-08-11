import Web3 from 'web3';

import {ContractAdapterNames} from '../types';
import {DaoRegistry} from '../../../../abi-types/DaoRegistry';

export async function getAdapterAddress(
  adapterName: ContractAdapterNames,
  daoContractInstance: DaoRegistry | undefined
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    const adapterNameSha3 = Web3.utils.sha3(adapterName);

    if (!adapterNameSha3) {
      throw new Error('No sha3 adapter name was returned.');
    }

    return await daoContractInstance.methods
      .getAdapterAddress(adapterNameSha3)
      .call();
  } catch (error) {
    throw error;
  }
}
