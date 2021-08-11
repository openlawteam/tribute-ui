import {AbiItem} from 'web3-utils/types';

import {ContractDAOConfigKeys} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {DaoRegistry} from '../../../../abi-types/DaoRegistry';
import {getDAOConfigEntry} from '.';
import {getWeb3Instance} from '../../../test/helpers';
import DaoRegistryABI from '../../../abis/DaoRegistry.json';

describe('getDAOConfigEntry unit tests', () => {
  test('should return correct config value', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;
    const instance = new web3.eth.Contract(
      DaoRegistryABI as AbiItem[],
      contractAddress
    ) as any as DaoRegistry;

    const result: [string] = [web3.eth.abi.encodeParameter('uint256', 1000)];

    // Inject Web3 result for `getConfiguration.call()`
    mockWeb3Provider.injectResult(...result);

    const configEntry = await getDAOConfigEntry(
      ContractDAOConfigKeys.offchainVotingVotingPeriod,
      instance
    );

    expect(configEntry).toBe('1000');
  });

  test('should throw if no contract instance provided', async () => {
    let capturedError: string = '';

    try {
      await getDAOConfigEntry(
        ContractDAOConfigKeys.offchainVotingVotingPeriod,
        undefined
      );
    } catch (error) {
      capturedError = error.message;
    }

    expect(capturedError).toBe('No DaoRegistry contract instance provided.');
  });
});
