import {InjectResultOptions} from '../helpers/FakeHttpProvider';

/**
 * sendTransaction
 *
 * Mocks eth_sendtransaction
 *
 * @returns {[string, InjectResultOptions]}
 *
 * @see https://eth.wiki/json-rpc/API#eth_sendtransaction
 */
export const sendTransaction = (): [string, InjectResultOptions] => {
  return [
    '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
    {rpcMethodName: 'eth_sendTransaction'},
  ];
};
