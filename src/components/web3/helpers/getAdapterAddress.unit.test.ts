import {AbiItem} from 'web3-utils/types';

import {ContractAdapterNames} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {DaoRegistry} from '../../../abis/types/DaoRegistry';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {getAdapterAddress} from '.';
import DaoRegistryABI from '../../../abis/tribute-contracts/DaoRegistry.json';

describe('getAdapterAddress unit tests', () => {
  test('should return correct address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
    const instance = new web3.eth.Contract(
      DaoRegistryABI as AbiItem[],
      contractAddress
    ) as any as DaoRegistry;

    const result: [string] = [
      web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    ];

    // Inject Web3 result for `getAdapterAddress.call()`
    mockWeb3Provider.injectResult(...result);

    const address = await getAdapterAddress(
      ContractAdapterNames.onboarding,
      instance
    );

    expect(address).toBe(DEFAULT_ETH_ADDRESS);
  });

  test('should throw if no contract instance provided', async () => {
    let capturedError: string = '';

    try {
      await getAdapterAddress(ContractAdapterNames.onboarding, undefined);
    } catch (error) {
      const e = error as Error;

      capturedError = e.message;
    }

    expect(capturedError).toBe('No DaoRegistry contract instance provided.');
  });
});
