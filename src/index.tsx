import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import {ApolloProvider} from '@apollo/react-hooks';
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import WalletConnectProvider from '@walletconnect/web3-provider';

import {disableReactDevTools} from './util/helpers';
import {ENVIRONMENT, INFURA_PROJECT_ID, GRAPH_API_URL} from './config';
import {DefaultTheme} from './components/web3/hooks/useWeb3ModalManager';
import {store} from './store';
import App from './App';
import Init, {InitError} from './Init';
import Web3ModalManager from './components/web3/Web3ModalManager';
import reportWebVitals from './reportWebVitals';

import './assets/scss/style.scss';

const root = document.getElementById('root');

// disable React dev tools for production
ENVIRONMENT === 'production' && disableReactDevTools();

// will be deprecated eventually, for now we set it to false to silence the
// console warning
window.ethereum &&
  window.ethereum.autoRefreshOnNetworkChange &&
  (window.ethereum.autoRefreshOnNetworkChange = false);

// Tell Web3modal what providers we have available.
// Built-in web browser provider (only one can exist at a time),
// MetaMask, Brave or Opera is added automatically by Web3modal
function getProviderOptions() {
  const providerOptions = {
    // Injected providers
    injected: {
      display: {
        name: 'MetaMask',
        description: 'Connect with the provider in your Browser',
      },
      package: null,
    },
    // WalletConnect provider
    walletconnect: {
      display: {
        name: 'WalletConnect',
        description: 'Connect with your mobile wallet',
      },
      package: WalletConnectProvider,
      options: {
        infuraId: INFURA_PROJECT_ID, // required
        qrcodeModalOptions: {
          mobileLinks: ['rainbow', 'metamask', 'argent', 'trust'],
        },
      },
    },
  };
  return providerOptions;
}

// Create apolloClient
export const apolloClient:
  | ApolloClient<NormalizedCacheObject>
  | undefined = new ApolloClient({
  uri: GRAPH_API_URL,
  cache: new InMemoryCache(),
});

if (root !== null) {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <Web3ModalManager
          providerOptions={getProviderOptions()}
          defaultTheme={DefaultTheme.LIGHT}>
          <ApolloProvider client={apolloClient}>
            <Init
              render={({error, isInitComplete}) =>
                error ? (
                  <InitError error={error} />
                ) : isInitComplete ? (
                  <App />
                ) : null
              }
            />
          </ApolloProvider>
        </Web3ModalManager>
      </BrowserRouter>
    </Provider>,
    root
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
