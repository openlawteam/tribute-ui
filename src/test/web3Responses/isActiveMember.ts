import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DAORegistryABI from '../../truffle-contracts/DaoRegistry.json';

/**
 * isActiveMember
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/core/DaoRegistry.sol
 */
export const isActiveMember = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ?? web3Instance.eth.abi.encodeParameter('bool', true),
    {abiMethodName: 'isActiveMember', abi: DAORegistryABI},
  ];
};
