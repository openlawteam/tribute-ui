import {render, waitFor} from '@testing-library/react';

import Web3ModalManager, {Web3ModalContext} from './Web3ModalManager';

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

  test('should render correct default context', async () => {
    process.env.REACT_APP_DEFAULT_CHAIN_NAME_LOCAL = 'RINKEBY';

    render(
      <Web3ModalManager providerOptions={providerOptions}>
        <></>
      </Web3ModalManager>
    );

    await waitFor(() => {
      <Web3ModalContext.Consumer>
        {({web3Instance, provider, networkId}) => {
          expect(web3Instance).toBeDefined();
          expect(provider).toBeDefined();
          expect(networkId).toBe(0);

          return <></>;
        }}
      </Web3ModalContext.Consumer>;
    });
  });
});
