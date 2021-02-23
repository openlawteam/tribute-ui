import {ContractsStateEntry} from '../../../store/types';

export enum DaoState {
  CREATION = 'CREATION',
  READY = 'READY',
}

export async function getDaoState(
  daoContractInstance: ContractsStateEntry['instance'] | undefined
): Promise<DaoState> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    const daoRegistryMethods = daoContractInstance.methods;
    const state = await daoRegistryMethods.state().call();

    return Number(state) === 0 ? DaoState.CREATION : DaoState.READY;
  } catch (error) {
    throw error;
  }
}
