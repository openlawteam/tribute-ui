import {AbiItem} from 'web3-utils/types';
import Web3 from 'web3';

import {IVoting} from '../../../../abi-types/IVoting';
import {VotingAdapterName} from '../../adapters-extensions/enums';

export async function getVotingAdapterName(
  address: string,
  web3Instance: Web3
): Promise<VotingAdapterName> {
  try {
    const {default: lazyIVotingABI} = await import(
      '../../../abis/IVoting.json'
    );

    const votingAdapterName: string = await (
      new web3Instance.eth.Contract(
        lazyIVotingABI as AbiItem[],
        address
      ) as any as IVoting
    ).methods
      .getAdapterName()
      .call();

    return votingAdapterName as VotingAdapterName;
  } catch (error) {
    throw error;
  }
}
