import {AbiItem} from 'web3-utils/types';

import {ContractExtensionNames} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS, DEFAULT_CHAIN} from '../../../config';
import {getExtensionAddress} from '.';
import {getWeb3Instance} from '../../../test/helpers';
import DAORegistryABI from '../../../truffle-contracts/DaoRegistry.json';

describe('getExtensionAddress unit tests', () => {
  test('should return correct address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS[DEFAULT_CHAIN];
    const instance = new web3.eth.Contract(
      DAORegistryABI as AbiItem[],
      contractAddress
    );

    const result: [string] = [
      web3.eth.abi.encodeParameter(
        'bytes32',
        '0x000000000000000000000000000000000000000'
      ),
    ];

    // Inject Web3 result for `getExtensionAddress.call()`
    mockWeb3Provider.injectResult(...result);

    const address = await getExtensionAddress(
      ContractExtensionNames.bank,
      instance
    );

    expect(address).toBe('0x0000000000000000000000000000000000000000');
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
