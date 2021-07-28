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
import {QueryClient, QueryClientProvider} from 'react-query';
// @todo Remove react-query dev tools before merging
import {ReactQueryDevtools} from 'react-query/devtools';

import {
  ENVIRONMENT,
  GRAPH_API_URL,
  WALLETCONNECT_PROVIDER_OPTIONS,
} from './config';
import {clearConnectedMember, clearContracts} from './store/actions';
import {disableReactDevTools} from './util/helpers';
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

// Create `QueryClient`
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

if (root !== null) {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Web3ModalManager
          onBeforeDisconnect={() => {
            // Clear out `connectedMember` and `contracts` Redux state
            store.dispatch(clearConnectedMember());
            store.dispatch(clearContracts());
          }}
          onBeforeConnect={() => {
            // Clear out `contracts` Redux state
            store.dispatch(clearContracts());
          }}
          providerOptions={WALLETCONNECT_PROVIDER_OPTIONS}>
          <ApolloProvider client={getApolloClient(store)}>
            <QueryClientProvider client={queryClient}>
              <Init
                render={({error, isInitComplete}) =>
                  error ? (
                    <App
                      renderMainContent={() => <InitError error={error} />}
                    />
                  ) : isInitComplete ? (
                    <App />
                  ) : null
                }
              />
              {/* @todo Remove react-query dev tools before merging */}
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
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
