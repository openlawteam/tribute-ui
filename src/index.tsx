import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import WalletConnectProvider from '@walletconnect/web3-provider';

import {disableReactDevTools} from './util/helpers';
import {ENVIRONMENT, INFURA_PROJECT_ID} from './util/config';
import {store} from './store';
import App from './App';
import reportWebVitals from './reportWebVitals';

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

if (root !== null) {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>,
    root
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
