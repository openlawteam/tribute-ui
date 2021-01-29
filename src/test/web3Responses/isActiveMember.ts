import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DaoRegistryJSON from '../../truffle-contracts/DaoRegistry.json';

const daoRegistryABI = DaoRegistryJSON.abi;

/**
 * isActiveMember
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/laoland/blob/master/contracts/core/DaoRegistry.sol
 */
export const isActiveMember = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ?? web3Instance.eth.abi.encodeParameter('bool', true),
    {abiMethodName: 'isActiveMember', abi: daoRegistryABI},
  ];
};
