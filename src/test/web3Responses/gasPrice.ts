import Web3 from 'web3';

import {InjectResultOptions} from '../helpers/FakeHttpProvider';

export const ethGasPrice = (
  web3Instance: Web3
): [string, InjectResultOptions] => {
  return [
    web3Instance.eth.abi.encodeParameter('uint256', 8049999872),
    {rpcMethodName: 'eth_gasPrice'},
  ];
};
