import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';
import Web3Modal, {removeLocal, setLocal} from 'web3modal';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {INFURA_PROJECT_ID} from '../../../config';
import useWeb3ModalManager, {DefaultTheme} from './useWeb3ModalManager';

const providerOptions = {
  injected: {
    display: {
      name: 'MetaMask',
      description: 'Connect with the provider in your Browser',
    },
    package: null,
  },
  walletconnect: {
    display: {
      name: 'WalletConnect',
      description: 'Connect with your mobile wallet',
    },
    options: {
      infuraId: INFURA_PROJECT_ID,
      qrcodeModalOptions: {
        mobileLinks: ['rainbow', 'metamask', 'argent', 'trust'],
      },
    },
    package: null,
  },
};

describe('useWeb3ModalManager unit tests', () => {
  test('initial: should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          providerOptions,
        })
      );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);
    });
  });

  test('connect: should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          providerOptions,
        })
      );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      result.current.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      mock?.mockRestore();
    });
  });

  test('connect from cached: should return correct data', async () => {
    // Set a cached connection id
    // Use `setLocal` from `web3modal` so it's easy to access the same instance of `Storage` in a test environment.
    setLocal('WEB3_CONNECT_CACHED_PROVIDER', 'injected');

    await act(async () => {
      const {result, waitForValueToChange, waitFor, rerender} =
        await renderHook(() =>
          useWeb3ModalManager({
            defaultTheme: DefaultTheme.LIGHT,
            providerOptions,
          })
        );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      /**
       * Re-render so we have time to set the mocks. Otherwise, it's not possible to beat the
       * timing of the running for the initial call of the connect function.
       */
      rerender();

      await waitFor(() => {
        expect(result.current.web3Modal).toBeDefined();
      });

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      mock?.mockRestore();
      removeLocal('WEB3_CONNECT_CACHED_PROVIDER');
    });
  });

  test('connect from cached (error): should return correct data', async () => {
    // Set a cached connection id
    // Use `setLocal` from `web3modal` so it's easy to access the same instance of `Storage` in a test environment.
    setLocal('WEB3_CONNECT_CACHED_PROVIDER', 'injected');

    await act(async () => {
      const {result, waitForValueToChange, waitFor, rerender} =
        await renderHook(() =>
          useWeb3ModalManager({
            defaultTheme: DefaultTheme.LIGHT,
            providerOptions,
          })
        );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      /**
       * Re-render so we have time to set the mocks. Otherwise, it's not possible to beat the
       * timing of the running for the initial call of the connect function.
       */
      rerender();

      await waitFor(() => {
        expect(result.current.web3Modal).toBeDefined();
      });

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Mock error to `getAccounts` to force failure of the connect function
      fakeHttpProvider.injectError({code: 1234, message: 'Some weird error.'});

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.PENDING
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error?.connectorId).toBe('injected');
      expect(result.current.error?.error.message).toMatch(
        /failed to connect to injected\./i
      );
      expect(result.current.error?.type).toBe('CONNECT');
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      mock?.mockRestore();
      removeLocal('WEB3_CONNECT_CACHED_PROVIDER');
    });
  });

  test('onBeforeConnect: should run callback', async () => {
    const onBeforeConnectSpy = jest.fn();

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          onBeforeConnect: onBeforeConnectSpy,
          providerOptions,
        })
      );

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      result.current.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      expect(onBeforeConnectSpy.mock.calls.length).toBe(1);

      mock?.mockRestore();
    });
  });

  test('disconnect: should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          providerOptions,
        })
      );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      result.current.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      // Spy on `clearCachedProvider`
      const clearCachedProviderMock =
        result.current.web3Modal &&
        jest.spyOn(result.current.web3Modal, 'clearCachedProvider');

      // Disconnect
      result.current.disconnectWeb3Modal();

      await waitForValueToChange(() => result.current.connected);

      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(undefined);
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      // Assert `clearCachedProvider` called
      expect(clearCachedProviderMock?.mock.calls.length).toBe(1);

      mock?.mockRestore();
      clearCachedProviderMock?.mockRestore();
    });
  });

  test('disconnect (error): should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          providerOptions,
        })
      );

      // Assert initial
      expect(result.current.account).toBe(undefined);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(undefined);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.STANDBY
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(undefined);
      expect(result.current.provider).toBe(undefined);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBe(undefined);
      expect(result.current.web3Modal).toBe(undefined);

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      result.current.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error).toBe(undefined);
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      // Mock `clearCachedProvider` to throw an `Error`
      const clearCachedProviderMock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'clearCachedProvider')
          .mockImplementation(async () => {
            throw new Error('Some wild error.');
          });

      // Disconnect
      result.current.disconnectWeb3Modal();

      await waitForValueToChange(() => result.current.error);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error?.connectorId).toBe('');
      expect(result.current.error?.error.message).toMatch(
        /failed to disconnect from provider\./i
      );
      expect(result.current.error?.type).toBe('DISCONNECT');
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      // Assert `clearCachedProvider` called
      expect(clearCachedProviderMock?.mock.calls.length).toBe(1);

      mock?.mockRestore();
      clearCachedProviderMock?.mockRestore();
    });
  });

  test('disconnect from cached (error) : should return correct data', async () => {
    // Set a cached connection id
    // Use `setLocal` from `web3modal` so it's easy to access the same instance of `Storage` in a test environment.
    setLocal('WEB3_CONNECT_CACHED_PROVIDER', 'injected');

    await act(async () => {
      const {result, waitForValueToChange, waitFor, rerender} =
        await renderHook(() =>
          useWeb3ModalManager({
            defaultTheme: DefaultTheme.LIGHT,
            providerOptions,
          })
        );

      /**
       * Re-render so we have time to set the mocks. Otherwise, it's not possible to beat the
       * timing of the running for the initial call of the connect function.
       */
      rerender();

      await waitFor(() => {
        expect(result.current.web3Modal).toBeDefined();
      });

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      // Mock `clearCachedProvider` to throw an `Error`
      const clearCachedProviderMock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'clearCachedProvider')
          .mockImplementation(async () => {
            throw new Error('Some wild error.');
          });

      // Disconnect
      result.current.disconnectWeb3Modal();

      await waitForValueToChange(() => result.current.error);

      expect(result.current.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(result.current.connectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.connected).toBe(true);
      expect(result.current.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(result.current.error?.connectorId).toBe('injected');
      expect(result.current.error?.error.message).toMatch(
        /failed to disconnect from injected\./i
      );
      expect(result.current.error?.type).toBe('DISCONNECT');
      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      // No real network as we're in a test env
      expect(result.current.networkId).toBe(1337);
      expect(result.current.provider).toBeInstanceOf(FakeHttpProvider);
      expect(result.current.providerOptions).toBe(providerOptions);
      expect(result.current.web3Instance).toBeInstanceOf(Web3);
      expect(result.current.web3Modal).toBeInstanceOf(Web3Modal);

      // Assert `clearCachedProvider` called
      expect(clearCachedProviderMock?.mock.calls.length).toBe(1);

      mock?.mockRestore();
      clearCachedProviderMock?.mockRestore();
      removeLocal('WEB3_CONNECT_CACHED_PROVIDER');
    });
  });

  test('onBeforeDisconnect: should run callback', async () => {
    const onBeforeDisconnectSpy = jest.fn();

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useWeb3ModalManager({
          defaultTheme: DefaultTheme.LIGHT,
          onBeforeDisconnect: onBeforeDisconnectSpy,
          providerOptions,
        })
      );

      await waitForValueToChange(
        () => result.current.initialCachedConnectorCheckStatus
      );

      expect(result.current.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );

      const fakeHttpProvider = new FakeHttpProvider();

      const mock =
        result.current.web3Modal &&
        jest
          .spyOn(result.current.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      result.current.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);

      await waitForValueToChange(() => result.current.connected);

      // Disconnect
      result.current.disconnectWeb3Modal();

      await waitForValueToChange(() => result.current.connected);

      expect(onBeforeDisconnectSpy.mock.calls.length).toBe(1);

      mock?.mockRestore();
    });
  });
});
