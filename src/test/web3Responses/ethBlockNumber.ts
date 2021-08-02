import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * ethBlockNumber
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<string>}
 * @see https://eth.wiki/json-rpc/API#eth_blocknumber
 */
export const ethBlockNumber = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => [
  web3Instance.eth.abi.encodeParameter('uint256', result ?? 100),
  {debugName: '`ethBlockNumber` helper'},
];
