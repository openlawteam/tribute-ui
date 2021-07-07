import {act, renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';

import {CHAINS as mockChains, DEFAULT_CHAIN} from '../../../config';
import {useIsDefaultChain} from './useIsDefaultChain';
import Wrapper from '../../../test/Wrapper';

describe('useIsDefaultChain unit tests', () => {
  test('should return correct data when OK', async () => {
    await act(async () => {
      const {result} = await renderHook(() => useIsDefaultChain(), {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
        },
      });

      // Initial result
      await waitFor(() => {
        expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
        expect(result.current.defaultChainError).toBe(undefined);
        expect(result.current.isDefaultChain).toBe(true);
      });
    });
  });

  test('should return correct data when chain does not match default chain', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useIsDefaultChain(),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            web3ModalContext: {networkId: mockChains.RINKEBY},
          },
        }
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
    });
  });

  test('should return correct data when chain does not match default chain, and is not connected', async () => {
    await act(async () => {
      const {result} = await renderHook(() => useIsDefaultChain(), {
        wrapper: Wrapper,
        initialProps: {
          useWallet: true,
          web3ModalContext: {connected: false, networkId: mockChains.RINKEBY},
        },
      });

      await waitFor(() => {
        // Assert no changes
        expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
        expect(result.current.defaultChainError?.message).toBe(undefined);
        expect(result.current.isDefaultChain).toBe(false);
      });
    });
  });

  test('should return correct data when correct chain connected after wrong chain connected', async () => {
    await act(async () => {
      const {rerender, result, waitForValueToChange} = await renderHook(
        () => useIsDefaultChain(),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            web3ModalContext: {networkId: mockChains.RINKEBY},
          },
        }
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

      // Re-render
      rerender({
        useWallet: true,
        web3ModalContext: {networkId: mockChains.GANACHE},
      });

      await waitForValueToChange(() => result.current.defaultChainError);

      // Assert wrong network
      expect(result.current.defaultChain).toBe(DEFAULT_CHAIN);
      expect(result.current.defaultChainError?.message).toBe(undefined);
      expect(result.current.isDefaultChain).toBe(true);
    });
  });
});
