import {act, renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';

import {CHAINS as mockChains, DEFAULT_CHAIN} from '../../../config';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {useIsDefaultChain} from './useIsDefaultChain';
import Wrapper from '../../../test/Wrapper';

describe('useIsDefaultChain unit tests', () => {
  test('should return correct data when OK', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useIsDefaultChain(),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Initial result
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(false);

      await waitForValueToChange(() => result.current.isDefaultChain);

      // Assert OK
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(true);
    });
  });

  test('should return correct data when chain does not match default chain', async () => {
    await act(async () => {
      const useWeb3ModalToMock = await import('./useWeb3Modal');

      const {web3: mockWeb3, mockWeb3Provider} = getWeb3Instance();

      // Mock `useWeb3Modal` to return the wrong network
      const mock = jest
        .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
        .mockImplementation(() => ({
          account: DEFAULT_ETH_ADDRESS,
          connected: true,
          providerOptions: {},
          onConnectTo: () => {},
          onDisconnect: () => {},
          networkId: mockChains.RINKEBY,
          provider: mockWeb3Provider,
          web3Instance: mockWeb3,
          web3Modal: null,
        }));

      const {result, waitForValueToChange} = await renderHook(() =>
        useIsDefaultChain()
      );

      // Initial result
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(false);

      await waitForValueToChange(() => result.current.defaultChainError);

      // Assert wrong network
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError?.message).toMatch(
        /please connect to the ganache test network\./i
      );
      expect(result.current.isDefaultChain).toBe(false);

      mock.mockRestore();
    });
  });

  test('not connected: should return correct data when chain does not match default chain', async () => {
    await act(async () => {
      const useWeb3ModalToMock = await import('./useWeb3Modal');

      const {web3: mockWeb3, mockWeb3Provider} = getWeb3Instance();

      // Mock `useWeb3Modal` to return the wrong network and be disconnected
      const mock = jest
        .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
        .mockImplementation(() => ({
          account: DEFAULT_ETH_ADDRESS,
          connected: false,
          providerOptions: {},
          onConnectTo: () => {},
          onDisconnect: () => {},
          networkId: mockChains.RINKEBY,
          provider: mockWeb3Provider,
          web3Instance: mockWeb3,
          web3Modal: null,
        }));

      const {result} = await renderHook(() => useIsDefaultChain());

      await waitFor(() => {
        // Assert no changes
        expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
        expect(result.current.defaultChainError?.message).toBe(undefined);
        expect(result.current.isDefaultChain).toBe(false);
      });

      mock.mockRestore();
    });
  });

  test('should return correct data when correct chain connected after wrong chain connected', async () => {
    await act(async () => {
      const useWeb3ModalToMock = await import('./useWeb3Modal');

      const {web3: mockWeb3, mockWeb3Provider} = getWeb3Instance();

      // Mock `useWeb3Modal` to return the wrong network
      const mockBad = jest
        .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
        .mockImplementation(() => ({
          account: DEFAULT_ETH_ADDRESS,
          connected: true,
          providerOptions: {},
          onConnectTo: () => {},
          onDisconnect: () => {},
          networkId: mockChains.RINKEBY,
          provider: mockWeb3Provider,
          web3Instance: mockWeb3,
          web3Modal: null,
        }));

      const {rerender, result, waitForValueToChange} = await renderHook(() =>
        useIsDefaultChain()
      );

      // Initial result
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(false);

      await waitForValueToChange(() => result.current.defaultChainError);

      // Assert wrong network
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError?.message).toMatch(
        /please connect to the ganache test network\./i
      );
      expect(result.current.isDefaultChain).toBe(false);

      mockBad.mockRestore();

      // Mock `useWeb3Modal` to return the correct network
      const mockCorrect = jest
        .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
        .mockImplementation(() => ({
          account: DEFAULT_ETH_ADDRESS,
          connected: true,
          providerOptions: {},
          onConnectTo: () => {},
          onDisconnect: () => {},
          networkId: mockChains.GANACHE,
          provider: mockWeb3Provider,
          web3Instance: mockWeb3,
          web3Modal: null,
        }));

      // Re-render
      rerender();

      await waitForValueToChange(() => result.current.defaultChainError);

      // Assert wrong network
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError?.message).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(true);

      mockCorrect.mockRestore();
    });
  });
});
