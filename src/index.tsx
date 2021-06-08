import {render} from 'react-dom';
import {Store} from 'redux';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import {ApolloProvider} from '@apollo/react-hooks';
import {
  ApolloClient,
  concat,
  InMemoryCache,
  NormalizedCacheObject,
  HttpLink,
} from '@apollo/client';
import WalletConnectProvider from '@walletconnect/web3-provider';

import {AsyncStatus} from './util/types';
import {clearConnectedMember, clearContracts} from './store/actions';
import {DefaultTheme} from './components/web3/hooks/useWeb3ModalManager';
import {disableReactDevTools} from './util/helpers';
import {ENVIRONMENT, INFURA_PROJECT_ID, GRAPH_API_URL} from './config';
import {handleSubgraphError} from './gql';
import {store} from './store';
import App from './App';
import Init from './Init';
import InitError from './InitError';
import reportWebVitals from './reportWebVitals';
import Web3ModalManager from './components/web3/Web3ModalManager';

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

// Create `ApolloClient`
export const getApolloClient = (
  store: Store
): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient({
    link: concat(
      handleSubgraphError(store),
      new HttpLink({
        uri: ({operationName}) => `${GRAPH_API_URL}?${operationName}`,
      })
    ),
    cache: new InMemoryCache({
      // Cache data may be lost when replacing the `adapters|extensions`
      // field of a Query object. To address this problem
      // (which is not a bug in Apollo Client), define a custom
      // merge function for the Query.adapters|extensions field, so
      // InMemoryCache can safely merge these objects
      // https://www.apollographql.com/docs/react/caching/cache-field-behavior/#the-merge-function
      typePolicies: {
        Adapter: {
          fields: {
            adapters: {
              merge(existing = [], incoming: any[]) {
                return [...existing, ...incoming];
              },
            },
          },
        },
        Extension: {
          fields: {
            extensions: {
              merge(existing = [], incoming: any[]) {
                return [...existing, ...incoming];
              },
            },
          },
        },
      },
    }),
  });

if (root !== null) {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Web3ModalManager
          onAfterDisconnect={() => store.dispatch(clearConnectedMember())}
          onBeforeConnect={(state) =>
            state.initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED &&
            store.dispatch(clearContracts())
          }
          providerOptions={getProviderOptions()}
          defaultTheme={DefaultTheme.LIGHT}>
          <ApolloProvider client={getApolloClient(store)}>
            <Init
              render={({error, isInitComplete}) =>
                error ? (
                  <App renderMainContent={() => <InitError error={error} />} />
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
