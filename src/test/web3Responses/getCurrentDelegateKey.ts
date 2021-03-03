import {DEFAULT_ETH_ADDRESS} from '../helpers';
import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DAORegistryABI from '../../truffle-contracts/DaoRegistry.json';

/**
 * getCurrentDelegateKey
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/core/DaoRegistry.sol
 */
export const getCurrentDelegateKey = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ??
      web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    {abiMethodName: 'getCurrentDelegateKey', abi: DAORegistryABI},
  ];
};
