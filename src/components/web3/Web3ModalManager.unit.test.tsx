import {render, waitFor} from '@testing-library/react';

import Web3ModalManager, {
  Web3ModalContext,
  Web3ModalContextValue,
} from './Web3ModalManager';
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

  test('should provide default web3 instance and provider', async () => {
    let web3Context: Web3ModalContextValue;

    /**
     * Mock the websocket connection to the Web3 instance.
     * Not sure why the test `server` intercepts it as http(s),
     * but this seems to make it happy.
     */
    server.use(
      rest.get('http://127.0.0.1:7545/', async (_req, res, ctx) =>
        res(ctx.status(200))
      )
    );

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

    await waitFor(() => {
      expect(web3Context.web3Instance).toBeDefined();
      expect(web3Context.provider).toBeDefined();
      expect(web3Context.networkId).toBeUndefined();
    });
  });
});
