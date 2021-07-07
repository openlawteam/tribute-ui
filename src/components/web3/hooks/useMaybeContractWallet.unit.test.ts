import {act, renderHook} from '@testing-library/react-hooks';
import {formatBytes32String} from 'ethers/lib/utils';
import {waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {useMaybeContractWallet} from './useMaybeContractWallet';

describe('useMaybeContractWallet unit tests', () => {
  test('should return correct data when `true`', async () => {
    await act(async () => {
      const {mockWeb3Provider, web3} = getWeb3Instance();

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

      const {result, waitForValueToChange} = await renderHook(() =>
        useMaybeContractWallet(DEFAULT_ETH_ADDRESS, web3.currentProvider)
      );

      // Assert initial
      expect(result.current).toBe(false);

      await waitForValueToChange(() => result.current);

      // Assert response
      expect(result.current).toBe(true);
    });
  });

  test('should return correct data when `false`', async () => {
    await act(async () => {
      const {mockWeb3Provider, web3} = getWeb3Instance();

      // Mock internal `ethers` call to `eth_chainId`
      mockWeb3Provider.injectResult(
        web3.eth.abi.encodeParameter('uint256', 1337)
      );

      // Mock call to `eth_getCode`
      mockWeb3Provider.injectResult(0);

      const {result} = await renderHook(() =>
        useMaybeContractWallet(DEFAULT_ETH_ADDRESS, web3.currentProvider)
      );

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });
    });
  });

  test('should return correct data when error', async () => {
    await act(async () => {
      const {mockWeb3Provider, web3} = getWeb3Instance();

      // Mock internal `ethers` call to `eth_chainId`
      mockWeb3Provider.injectResult(
        web3.eth.abi.encodeParameter('uint256', 1337)
      );

      // Mock error
      mockWeb3Provider.injectError({
        code: 1234,
        message: 'Some bad error!',
      });

      const {result} = await renderHook(() =>
        useMaybeContractWallet(DEFAULT_ETH_ADDRESS, web3.currentProvider)
      );

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });
    });
  });
});
