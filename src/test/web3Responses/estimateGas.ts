import Web3 from 'web3';

import {InjectResultOptions} from '../helpers/FakeHttpProvider';

export const ethEstimateGas = (
  web3Instance: Web3
): [string, InjectResultOptions] => {
  return [
    web3Instance.eth.abi.encodeParameter('uint256', 12312),
    {rpcMethodName: 'eth_estimateGas'},
  ];
};
