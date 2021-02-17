import Web3 from 'web3';

import {ContractsStateEntry} from '../../../store/types';
import {ContractAdapterNames} from '../types';

export async function getAdapterAddress(
  adapterName: ContractAdapterNames,
  daoContractInstance: ContractsStateEntry['instance'] | undefined
): Promise<string> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    return await daoContractInstance.methods
      .getAdapterAddress(Web3.utils.sha3(adapterName))
      .call();
  } catch (error) {
    throw error;
  }
}
