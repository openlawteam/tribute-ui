import {AbiItem} from 'web3-utils/types';

import {ContractExtensionNames} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {DaoRegistry} from '../../../../abi-types/DaoRegistry';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {getExtensionAddress} from '.';
import DAORegistryABI from '../../../abis/DaoRegistry.json';

describe('getExtensionAddress unit tests', () => {
  test('should return correct address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
    const instance = new web3.eth.Contract(
      DAORegistryABI as AbiItem[],
      contractAddress
    ) as any as DaoRegistry;

    const result: [string] = [
      web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    ];

    // Inject Web3 result for `getExtensionAddress.call()`
    mockWeb3Provider.injectResult(...result);

    const address = await getExtensionAddress(
      ContractExtensionNames.bank,
      instance
    );

    expect(address).toBe(DEFAULT_ETH_ADDRESS);
  });

  test('should throw if no contract instance provided', async () => {
    let capturedError: string = '';

    try {
      await getExtensionAddress(ContractExtensionNames.bank, undefined);
    } catch (error) {
      capturedError = error.message;
    }

    expect(capturedError).toBe('No DaoRegistry contract instance provided.');
  });
});
