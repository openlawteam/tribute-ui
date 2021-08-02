import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * ethGasPrice
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<string>}
 * @see https://eth.wiki/json-rpc/API#eth_gasprice
 */
export const ethGasPrice = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => [
  web3Instance.eth.abi.encodeParameter('uint256', result ?? 8049999872),
  {debugName: '`ethGasPrice` helper'},
];
