import {DEFAULT_ETH_ADDRESS} from '../helpers';
import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';
import DAORegistryABI from '../../abis/DaoRegistry.json';
import BankExtensionABI from '../../abis/BankExtension.json';

/**
 * memberAddressesByDelegatedKey
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/core/DaoRegistry.sol
 */
export const memberAddressesByDelegatedKey = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ??
      web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    {debugName: '`memberAddressesByDelegatedKey` helper'},
  ];
};

/**
 * balanceOfMember
 *
 * Mocks result for `bank.balanceOf(member, tokenAddr)`.
 *
 * @param web3Instance
 * @returns {TestWeb3ResponseReturn<string>}
 * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/extensions/bank/Bank.sol
 */
export const balanceOfMember = ({
  result,
  web3Instance,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<string> => {
  return [
    result ?? web3Instance.eth.abi.encodeParameter('uint160', 100),
    {debugName: '`balanceOfMember` helper'},
  ];
};
