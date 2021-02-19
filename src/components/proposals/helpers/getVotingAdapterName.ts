import {Contract} from 'web3-eth-contract/types';

export async function getVotingAdapterName(
  managingInstance: Contract,
  daoRegistryAddress: string
) {
  try {
    return await managingInstance.methods
      .getVotingAdapterName(daoRegistryAddress)
      .call();
  } catch (error) {
    throw error;
  }
}
