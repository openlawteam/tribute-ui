import {DEFAULT_ETH_ADDRESS} from '../helpers';
import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DAORegistryABI from '../../truffle-contracts/DaoRegistry.json';

/**
 * memberAddressesByDelegatedKey
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/laoland/blob/master/contracts/core/DaoRegistry.sol
 */
export const memberAddressesByDelegatedKey = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ??
      web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    {abiMethodName: 'memberAddressesByDelegatedKey', abi: DAORegistryABI},
  ];
};
