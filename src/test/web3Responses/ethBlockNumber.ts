import Web3 from 'web3';

import {InjectResultOptions} from '../helpers/FakeHttpProvider';

/**
 * ethBlockNumber
 *
 * @param {Web3} web3Instance
 * @param {number} result
 * @see https://eth.wiki/json-rpc/API#eth_blocknumber
 */
export const ethBlockNumber = ({
  result,
  web3Instance,
}: {
  result?: number;
  web3Instance: Web3;
}): [string, InjectResultOptions] => {
  return [
    web3Instance.eth.abi.encodeParameter('uint256', result ?? 100),
    {rpcMethodName: 'eth_blockNumber'},
  ];
};
