import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';

import {MULTICALL_CONTRACT_ADDRESS} from '../../../config';

export type MulticallTuple = [
  contractAddress: string,
  functionABI: AbiItem,
  parameters: string[]
];

export async function multicall({
  blockNumber = 'latest',
  calls,
  web3Instance,
}: {
  /**
   * Defaults to `latest`
   */
  blockNumber?: number | string | ReturnType<typeof Web3.utils.toBN>;
  calls: MulticallTuple[];
  web3Instance: Web3;
}) {
  const {default: lazyMulticallABI} = await import(
    '../../../truffle-contracts/Multicall.json'
  );

  // Let's `console.error` and exit instead of throwing.
  if (!MULTICALL_CONTRACT_ADDRESS) {
    console.error('No Multicall address was found. Are you sure it is set?');
    return;
  }

  try {
    const {methods: multicallMethods} = new web3Instance.eth.Contract(
      lazyMulticallABI as AbiItem[],
      MULTICALL_CONTRACT_ADDRESS
    );

    const {returnData} = await multicallMethods
      .aggregate(
        calls.map(([address, abi, params]) => [
          address.toLowerCase(),
          web3Instance.eth.abi.encodeFunctionCall(abi, params),
        ])
      )
      .call({}, blockNumber);

    return returnData.map((hexString: string, i: number) => {
      const outputsABIItem = (calls[i] && calls[i][1].outputs) || [];
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
    });
  } catch (error) {
    throw error;
  }
}
