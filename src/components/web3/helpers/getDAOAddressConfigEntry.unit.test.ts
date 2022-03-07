import {AbiItem} from 'web3-utils/types';

import {ContractDAOConfigKeys} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {DaoRegistry} from '../../../abis/types/DaoRegistry';
import {getDAOAddressConfigEntry} from '.';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import DaoRegistryABI from '../../../abis/tribute-contracts/DaoRegistry.json';

describe('getDAOAddressConfigEntry unit tests', () => {
  test('should return correct address config value', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
    const instance = new web3.eth.Contract(
      DaoRegistryABI as AbiItem[],
      contractAddress
    ) as any as DaoRegistry;

    const result: [string] = [
      web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    ];

    // Inject Web3 result for `getAddressConfiguration.call()`
    mockWeb3Provider.injectResult(...result);

    const configEntry = await getDAOAddressConfigEntry(
      instance,
      ContractDAOConfigKeys.kycOnboardingFundTargetAddress
    );

    expect(configEntry).toBe(DEFAULT_ETH_ADDRESS);
  });

  test('should return correct config value if optional third argument provided', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
    const instance = new web3.eth.Contract(
      DaoRegistryABI as AbiItem[],
      contractAddress
    ) as any as DaoRegistry;

    const result: [string] = [
      web3.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS),
    ];

    // Inject Web3 result for `getAddressConfiguration.call()`
    mockWeb3Provider.injectResult(...result);

    const configEntry = await getDAOAddressConfigEntry(
      instance,
      ContractDAOConfigKeys.kycOnboardingFundTargetAddress,
      DEFAULT_ETH_ADDRESS
    );

    expect(configEntry).toBe(DEFAULT_ETH_ADDRESS);
  });

  test('should throw if no contract instance provided', async () => {
    let capturedError: string = '';

    try {
      await getDAOAddressConfigEntry(
        undefined,
        ContractDAOConfigKeys.kycOnboardingFundTargetAddress
      );
    } catch (error) {
      const {message} = error as Error;

      capturedError = message;
    }

    expect(capturedError).toBe('No DaoRegistry contract instance provided.');
  });
});
