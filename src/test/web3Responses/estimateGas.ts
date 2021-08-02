import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * ethEstimateGas
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<string>}
 * @see https://eth.wiki/json-rpc/API#eth_estimategas
 */
export const ethEstimateGas = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => [
  web3Instance.eth.abi.encodeParameter('uint256', result ?? 12312),
  {debugName: '`ethEstimateGas` helper'},
];
