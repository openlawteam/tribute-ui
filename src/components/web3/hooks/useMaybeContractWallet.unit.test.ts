import {act, renderHook} from '@testing-library/react-hooks';
import {formatBytes32String} from 'ethers/lib/utils';
import {waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {FakeHttpProvider} from '../../../test/helpers';
import {useMaybeContractWallet} from './useMaybeContractWallet';
import Wrapper, {WrapperReturnProps} from '../../../test/Wrapper';

describe('useMaybeContractWallet unit tests', () => {
  test('should return correct data when `true`', async () => {
    const props = {
      wrapper: Wrapper,
      initialProps: {
        getProps: ({mockWeb3Provider, web3Instance}: WrapperReturnProps) => {
          // Mock internal `ethers` call to `eth_chainId`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock call to `eth_getCode`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter(
              'bytes',
              formatBytes32String('some code at an address')
            )
          );
        },
        useWallet: true,
      },
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useMaybeContractWallet(),
        props
      );

      // Assert initial
      expect(result.current).toBe(false);

      await waitForValueToChange(() => result.current);

      // Assert response
      expect(result.current).toBe(true);
    });
  });

  test('should return correct data when `false`', async () => {
    const props = {
      wrapper: Wrapper,
      initialProps: {
        getProps: ({mockWeb3Provider, web3Instance}: WrapperReturnProps) => {
          // Mock internal `ethers` call to `eth_chainId`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock call to `eth_getCode`
          mockWeb3Provider.injectResult(0);
        },
        useWallet: true,
      },
    };

    await act(async () => {
      const {result} = await renderHook(() => useMaybeContractWallet(), props);

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });
    });
  });

  test('should return correct data when error', async () => {
    const props = {
      wrapper: Wrapper,
      initialProps: {
        getProps: ({mockWeb3Provider, web3Instance}: WrapperReturnProps) => {
          // Mock internal `ethers` call to `eth_chainId`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock error
          mockWeb3Provider.injectError({
            code: 1234,
            message: 'Some bad error!',
          });
        },
        useWallet: true,
      },
    };

    await act(async () => {
      const {result} = await renderHook(() => useMaybeContractWallet(), props);

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });
    });
  });

  test('should return correct data when account changes', async () => {
    const props = {
      wrapper: Wrapper,
      initialProps: {
        getProps: ({mockWeb3Provider, web3Instance}: WrapperReturnProps) => {
          // Mock internal `ethers` call to `eth_chainId`
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock call to `eth_getCode`
          mockWeb3Provider.injectResult(0);
        },
        useWallet: true,
      },
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const propsRerender = {
      getProps: (p: WrapperReturnProps) => {
        mockWeb3Provider = p.mockWeb3Provider;
        web3Instance = p.web3Instance;

        // Mock internal `ethers` call to `eth_chainId`
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameter('uint256', 1337)
        );

        // Mock call to `eth_getCode`
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameter(
            'bytes',
            formatBytes32String('some code at an address')
          )
        );
      },
      useWallet: true,
    };

    await act(async () => {
      const {rerender, result, waitForValueToChange} = await renderHook(
        () => useMaybeContractWallet(),
        props
      );

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });

      const useWeb3ModalToMock = await import('./useWeb3Modal');

      // Change the mock implementation (once) from `Wrapper` so the `account` is different
      (useWeb3ModalToMock.useWeb3Modal as jest.Mock).mockImplementationOnce(
        () => ({
          account: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
          connected: true,
          error: undefined,
          initialCachedConnectorCheckStatus: AsyncStatus.FULFILLED,
          providerOptions: {},
          connectWeb3Modal: () => {},
          disconnectWeb3Modal: () => {},
          networkId: 1337,
          provider: mockWeb3Provider,
          web3Instance,
          web3Modal: null as any,
        })
      );

      // Re-render
      rerender(propsRerender);
      // Re-render
      rerender(propsRerender);

      await waitFor(() => {
        // Assert response
        expect(result.current).toBe(false);
      });

      await waitForValueToChange(() => result.current);

      // Assert response
      expect(result.current).toBe(true);
    });
  });
});
