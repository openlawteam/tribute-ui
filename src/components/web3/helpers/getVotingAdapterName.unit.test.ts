import {waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {getVotingAdapterName} from '.';
import {VotingAdapterName} from '../../adapters-extensions/enums';

describe('getVotingAdapterName unit tests', () => {
  test('should return correct address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    const result: [string] = [
      web3.eth.abi.encodeParameter(
        'string',
        VotingAdapterName.OffchainVotingContract
      ),
    ];

    // Inject Web3 result for `getVotingAdapterName.call()`
    mockWeb3Provider.injectResult(...result);

    const votingAdapterName = await getVotingAdapterName(
      DEFAULT_ETH_ADDRESS,
      web3
    );

    expect(votingAdapterName).toBe(VotingAdapterName.OffchainVotingContract);
  });

  test('should throw if RPC error', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Inject Web3 result for `getVotingAdapterName.call()`
    mockWeb3Provider.injectError({code: 1234, message: 'Some bad error'});

    let thrownError: Error;

    try {
      await getVotingAdapterName(DEFAULT_ETH_ADDRESS, web3);
    } catch (error) {
      thrownError = error;
    }

    await waitFor(() => {
      expect(thrownError.message).toMatch(/some bad error/i);
    });
  });

  test('should throw if address parameter is incorrect', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    const result: [string] = [
      web3.eth.abi.encodeParameter(
        'string',
        VotingAdapterName.OffchainVotingContract
      ),
    ];

    // Inject Web3 result for `getVotingAdapterName.call()`
    mockWeb3Provider.injectResult(...result);

    let thrownError: Error;

    try {
      await getVotingAdapterName('abc123', web3);
    } catch (error) {
      thrownError = error;
    }

    await waitFor(() => {
      expect(thrownError.message).toBeTruthy();
    });
  });
});
