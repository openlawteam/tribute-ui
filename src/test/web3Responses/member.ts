import {DEFAULT_ETH_ADDRESS} from '../helpers';
import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DAORegistryABI from '../../truffle-contracts/DaoRegistry.json';
import BankExtensionABI from '../../truffle-contracts/BankExtension.json';

/**
 * memberAddressesByDelegatedKey
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/core/DaoRegistry.sol
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

/**
 * balanceOfMember
 *
 * Mocks result for `bank.balanceOf(member, tokenAddr)`.
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/extensions/bank/Bank.sol
 */
export const balanceOfMember = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ?? web3Instance.eth.abi.encodeParameter('uint160', 100),
    {abiMethodName: 'balanceOf', abi: BankExtensionABI},
  ];
};

/**
 * getMemberAddress
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/core/DaoRegistry.sol
 */
export const getMemberAddress = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ??
      web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    {abiMethodName: 'getMemberAddress', abi: DAORegistryABI},
  ];
};
