import {DaoRegistry} from '../../../../abi-types/DaoRegistry';

export enum DaoState {
  CREATION = 'CREATION',
  READY = 'READY',
}

export async function getDaoState(
  daoContractInstance: DaoRegistry | undefined
): Promise<DaoState> {
  try {
    if (!daoContractInstance) {
      throw new Error('No DaoRegistry contract instance provided.');
    }

    const state = await daoContractInstance.methods.state().call();

    return Number(state) === 0 ? DaoState.CREATION : DaoState.READY;
  } catch (error) {
    throw error;
  }
}
