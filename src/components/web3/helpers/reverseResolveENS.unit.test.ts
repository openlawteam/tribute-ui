import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {reverseResolveENS, REVERSE_RECORDS_ADDRESS} from './reverseResolveENS';

describe('reverseResolveENS unit tests', () => {
  test('should return reverse resolved name', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock the `ReverseRecords.getNames` response
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('string[]', ['someone.eth', 'cat.eth'])
    );

    expect(
      await reverseResolveENS([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS], web3)
    ).toEqual(['someone.eth', 'cat.eth']);

    // cleanup
    delete REVERSE_RECORDS_ADDRESS[1337];
  });

  test('should return original addresses', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Assert no network contract address
    expect(
      await reverseResolveENS([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS], web3)
    ).toEqual([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS]);

    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    // Mock the `ReverseRecords.getNames` response
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('string[]', ['', ''])
    );

    // Assert empty resolved responses
    expect(
      await reverseResolveENS([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS], web3)
    ).toEqual([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS]);

    // Assert empty addresses
    expect(await reverseResolveENS([], web3)).toEqual([]);

    // Assert no addresses
    expect(await reverseResolveENS(undefined as any, web3)).toBe(undefined);

    // cleanup
    delete REVERSE_RECORDS_ADDRESS[1337];
  });
});
