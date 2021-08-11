import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';

import {BlockType} from '../../../../abi-types/types';
import {MULTICALL_CONTRACT_ADDRESS} from '../../../config';
import {Multicall} from '../../../../abi-types/Multicall';

export type MulticallTuple = [
  contractAddress: string,
  functionABI: AbiItem,
  parameters: string[]
];

export async function multicall<T = any[]>({
  blockNumber = 'latest',
  calls,
  web3Instance,
}: {
  /**
   * Defaults to `latest`
   */
  blockNumber?: BlockType;
  calls: MulticallTuple[];
  web3Instance: Web3;
}): Promise<T> {
  const {default: lazyMulticallABI} = await import(
    '../../../abis/Multicall.json'
  );

  if (!MULTICALL_CONTRACT_ADDRESS) {
    throw new Error('No Multicall address was found. Are you sure it is set?');
  }

  try {
    const {methods: multicallMethods} = new web3Instance.eth.Contract(
      lazyMulticallABI as AbiItem[],
      MULTICALL_CONTRACT_ADDRESS
    ) as any as Multicall;

    const {returnData} = await multicallMethods
      .aggregate(
        calls.map(([address, abi, params]) => [
          address.toLowerCase(),
          web3Instance.eth.abi.encodeFunctionCall(abi, params),
        ])
      )
      .call({}, blockNumber);

    return returnData.map((hexString: string, i: number) => {
      const outputsABIItem = calls[i][1].outputs || [];
      const decodedOutputs = web3Instance.eth.abi.decodeParameters(
        outputsABIItem,
        hexString
      );

      // Output as single result
      if (
        decodedOutputs.__length__ === 1 &&
        decodedOutputs['0'] !== undefined
      ) {
        return decodedOutputs['0'];
      }

      return web3Instance.eth.abi.decodeParameters(
        outputsABIItem || [],
        hexString
      );
    }) as any as T;
  } catch (error) {
    throw error;
  }
}
