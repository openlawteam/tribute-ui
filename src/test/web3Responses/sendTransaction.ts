import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * sendTransaction
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<string>}
 * @see https://eth.wiki/json-rpc/API#eth_sendtransaction
 */
export const sendTransaction = ({
  result,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => [
  result ?? '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
  {debugName: '`sendTransaction` helper'},
];
