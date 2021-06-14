import {render, waitFor} from '@testing-library/react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import WebsocketProvider from 'web3-providers-ws';

import Web3ModalManager, {
  Web3ModalContext,
  Web3ModalContextValue,
} from './Web3ModalManager';
import {AsyncStatus} from '../../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {rest, server} from '../../test/server';
import Wrapper from '../../test/Wrapper';

describe('Web3ModalManager unit tests', () => {
  const providerOptions = {
    // Injected providers
    injected: {
      display: {
        name: 'MetaMask',
      },
      package: null,
    },
  };

  beforeEach(() => {
    /**
     * Mock the initial websocket connection to the Web3 instance.
     */
    server.use(
      rest.get('http://127.0.0.1:7545/', async (_req, res, ctx) =>
        res(ctx.status(200))
      )
    );
  });

  test('should provide correct data when connected', async () => {
    let web3Context: Web3ModalContextValue;
    let mock: jest.SpyInstance | undefined;

    render(
      <Wrapper>
        <Web3ModalManager providerOptions={providerOptions}>
          <Web3ModalContext.Consumer>
            {(context) => {
              web3Context = context;

              return <></>;
            }}
          </Web3ModalContext.Consumer>
        </Web3ModalManager>
      </Wrapper>
    );

    // Assert initial
    await waitFor(() => {
      expect(web3Context.account).toBe(undefined);
      expect(web3Context.connected).toBe(undefined);
      expect(web3Context.connectWeb3Modal).toBeInstanceOf(Function);
      expect(web3Context.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(web3Context.error).toBe(undefined);
      expect(web3Context.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      expect(web3Context.networkId).toBe(undefined);
      expect(web3Context.provider).toBeInstanceOf(WebsocketProvider);
      expect(web3Context.providerOptions).toBeInstanceOf(Object);
      expect(web3Context.web3Instance).toBeInstanceOf(Web3);
      expect(web3Context.web3Modal).toBeInstanceOf(Web3Modal);
    });

    await waitFor(() => {
      expect(web3Context.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });

    // Mock `web3Modal.connectTo` and RPC responses
    await waitFor(() => {
      const fakeHttpProvider = new FakeHttpProvider();

      mock =
        web3Context.web3Modal &&
        jest
          .spyOn(web3Context.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      web3Context.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);
    });

    // Assert connected state
    await waitFor(() => {
      expect(web3Context.account).toBe(DEFAULT_ETH_ADDRESS);
      expect(web3Context.connected).toBe(true);
      expect(web3Context.connectWeb3Modal).toBeInstanceOf(Function);
      expect(web3Context.disconnectWeb3Modal).toBeInstanceOf(Function);
      expect(web3Context.error).toBe(undefined);
      expect(web3Context.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
      expect(web3Context.networkId).toBe(1337);
      expect(web3Context.provider).toBeInstanceOf(FakeHttpProvider);
      expect(web3Context.providerOptions).toBeInstanceOf(Object);
      expect(web3Context.web3Instance).toBeInstanceOf(Web3);
      expect(web3Context.web3Modal).toBeInstanceOf(Web3Modal);
    });

    await waitFor(() => {
      mock?.mockRestore();
    });
  });

  test('should pass and call `onBeforeConnect`, `onBeforeDisconnect`', async () => {
    let web3Context: Web3ModalContextValue;
    let mock: jest.SpyInstance | undefined;

    const connectSpy = jest.fn();
    const disconnectSpy = jest.fn();

    render(
      <Wrapper>
        <Web3ModalManager
          onBeforeConnect={connectSpy}
          onBeforeDisconnect={disconnectSpy}
          providerOptions={providerOptions}>
          <Web3ModalContext.Consumer>
            {(context) => {
              web3Context = context;

              return <></>;
            }}
          </Web3ModalContext.Consumer>
        </Web3ModalManager>
      </Wrapper>
    );

    await waitFor(() => {
      expect(web3Context.initialCachedConnectorCheckStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });

    // Mock `web3Modal.connectTo` and RPC responses
    await waitFor(() => {
      const fakeHttpProvider = new FakeHttpProvider();

      mock =
        web3Context.web3Modal &&
        jest
          .spyOn(web3Context.web3Modal, 'connectTo')
          .mockImplementation(async () => fakeHttpProvider);

      // Connect
      web3Context.connectWeb3Modal('injected');

      // Mock call to `getAccounts`
      fakeHttpProvider.injectResult([DEFAULT_ETH_ADDRESS]);
      // Mock call to `getId`
      fakeHttpProvider.injectResult(1337);
    });

    // Assert `onBeforeConnect` called
    await waitFor(() => {
      expect(connectSpy.mock.calls.length).toBe(1);
    });

    await waitFor(() => {
      web3Context.disconnectWeb3Modal();
    });

    // Assert `onBeforeDisconnect` called
    await waitFor(() => {
      expect(disconnectSpy.mock.calls.length).toBe(1);
    });

    await waitFor(() => {
      mock?.mockRestore();
    });
  });

  test('should provide default `Web3` instance and provider', async () => {
    let web3Context: Web3ModalContextValue;

    render(
      <Wrapper>
        <Web3ModalManager providerOptions={providerOptions}>
          <Web3ModalContext.Consumer>
            {(context) => {
              web3Context = context;

              return <></>;
            }}
          </Web3ModalContext.Consumer>
        </Web3ModalManager>
      </Wrapper>
    );

    // Assert default `web3Instance` and `provider`
    await waitFor(() => {
      expect(web3Context.web3Instance).toBeInstanceOf(Web3);
      expect(web3Context.provider).toBeInstanceOf(WebsocketProvider);
    });
  });
});
