import {DAO_REGISTRY_CONTRACT_ADDRESS, DEFAULT_CHAIN} from '../../../config';
import {getWeb3Instance} from '../../../test/helpers';
import {ContractDAOConfigKeys} from '../types';
import {getDAOConfigEntry} from '.';
import DaoRegistry from '../../../truffle-contracts/DaoRegistry.json';

describe('getDAOConfigEntry unit tests', () => {
  test('should return correct config value', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS[DEFAULT_CHAIN];
    const instance = new web3.eth.Contract(
      (DaoRegistry as Record<string, any>).abi,
      contractAddress
    );

    const result: [string] = [web3.eth.abi.encodeParameter('uint256', 1000)];

    // Inject Web3 result for `getConfiguration.call()`
    mockWeb3Provider.injectResult(...result);

    const address = await getDAOConfigEntry(
      ContractDAOConfigKeys.offchainVotingVotingPeriod,
      instance
    );

    expect(address).toBe('1000');
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
