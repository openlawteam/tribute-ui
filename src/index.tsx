import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';

import {disableReactDevTools} from './util/helpers';
import {ENVIRONMENT} from './util/config';
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
