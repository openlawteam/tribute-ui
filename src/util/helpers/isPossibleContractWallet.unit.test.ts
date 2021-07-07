import {Web3Provider} from '@ethersproject/providers';
import {formatBytes32String} from '@ethersproject/strings';
import {waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../test/helpers';
import {isPossibleContractWallet} from './isPossibleContractWallet';

describe('isPossibleContractWallet unit tests', () => {
  test('should return `true` if possible contract wallet', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock internal `ethers` call to `eth_chainId`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('uint256', 1337)
    );

    // Mock call to `eth_getCode`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter(
        'bytes',
        formatBytes32String('some code at an address')
      )
    );

    /**
     * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
     * but this does work.
     */
    const provider = new Web3Provider(mockWeb3Provider);

    const result = await isPossibleContractWallet(
      DEFAULT_ETH_ADDRESS,
      provider
    );

    expect(result).toBe(true);
  });

  test('should return `false` if not possible contract wallet', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock internal `ethers` call to `eth_chainId`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('uint256', 1337)
    );

    // Mock call to `eth_getCode`
    mockWeb3Provider.injectResult(0);

    /**
     * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
     * but this does work.
     */
    const provider = new Web3Provider(mockWeb3Provider);

    const result = await isPossibleContractWallet(
      DEFAULT_ETH_ADDRESS,
      provider
    );

    expect(result).toBe(false);
  });

  test('should throw error if response error', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock internal `ethers` call to `eth_chainId`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('uint256', 1337)
    );

    // Mock error
    mockWeb3Provider.injectError({code: 1234, message: 'Some bad error!'});

    /**
     * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
     * but this does work.
     */
    const provider = new Web3Provider(mockWeb3Provider);

    let resultError: Error;

    try {
      await isPossibleContractWallet(DEFAULT_ETH_ADDRESS, provider);
    } catch (error) {
      resultError = error;
    }

    await waitFor(() => {
      expect(resultError?.message).toBeDefined();
    });
  });

  test('should throw error if empty address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock internal `ethers` call to `eth_chainId`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('uint256', 1337)
    );

    // Mock call to `eth_getCode`
    mockWeb3Provider.injectResult(0);

    /**
     * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
     * but this does work.
     */
    const provider = new Web3Provider(mockWeb3Provider);

    let resultError: Error;

    try {
      await isPossibleContractWallet('', provider);
    } catch (error) {
      resultError = error;
    }

    await waitFor(() => {
      expect(resultError?.message).toBeDefined();
    });
  });

  test('should throw error if bad address', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock internal `ethers` call to `eth_chainId`
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameter('uint256', 1337)
    );

    // Mock call to `eth_getCode`
    mockWeb3Provider.injectResult(0);

    /**
     * Web3 `provider` doesn't provide the correct types to satisfy `Web3Provider`,
     * but this does work.
     */
    const provider = new Web3Provider(mockWeb3Provider);

    let resultError: Error;

    try {
      await isPossibleContractWallet('0x0', provider);
    } catch (error) {
      resultError = error;
    }

    await waitFor(() => {
      expect(resultError?.message).toBeDefined();
    });
  });
});
