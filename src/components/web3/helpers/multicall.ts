import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';

import MulticallABI from '../../../truffle-contracts/Multicall.json';

export async function multicall(
  network: string,
  functionABI: AbiItem,
  calls: any[],
  web3Instance: Web3
) {
  const {methods: multicallMethods} = new web3Instance.eth.Contract(
    MulticallABI as AbiItem[]
  );

  // const itf = new Interface(abi);

  // try {
  //   const [, res] = await multicallMethods.aggregate(
  //     calls.map((call) => [
  //       call[0].toLowerCase(),
  //       // itf.encodeFunctionData(call[1], call[2])
  //       web3Instance.eth.abi.encodeFunctionCall(functionABI)
  //     ]),
  //     options || {}
  //   );
  //   return res.map((call, i) => itf.decodeFunctionResult(calls[i][1], call));
  // } catch (e) {
  //   return Promise.reject(e);
  // }
}
