import {AbiItem} from 'web3-utils/types';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import Web3 from 'web3';

export async function getVotingAdapterName(
  address: string,
  web3Instance: Web3
): Promise<VotingAdapterName> {
  try {
    const {default: lazyIVotingABI} = await import(
      '../../../abis/IVoting.json'
    );

    return await new web3Instance.eth.Contract(
      lazyIVotingABI as AbiItem[],
      address
    ).methods
      .getAdapterName()
      .call();
  } catch (error) {
    throw error;
  }
}
