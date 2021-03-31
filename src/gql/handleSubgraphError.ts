import {ApolloLink} from '@apollo/client';
import {onError} from '@apollo/client/link/error';
import {Store} from 'redux';

import {setSubgraphNetworkStatus} from '../store/actions';
import {SubgraphNetworkStatus} from '../store/subgraphNetworkStatus/types';
import {StoreState} from '../store/types';

/**
 * handleSubgraphError
 *
 * Handles an error from The Graph's GQL server at the Apollo
 * Link level.
 *
 * Handles network errors from The Graph's GQL server.
 *
 * About network errors from the Apollo Docs:
 *
 *   "Network errors occur "These are errors encountered while attempting
 *    to communicate with your GraphQL server, usually resulting in a
 *    4xx or 5xx response status code (and no data)."
 *
 * We do not handle GQL errors that arise from individual queries.
 * Perhaps it best to handle those inside of the concerned components
 * (i.e. IF query error || subgraph is down THEN fallback)
 *
 * About GQL errors from the Apollo Docs:
 *
 *  - Syntax errors (e.g., a query was malformed)
 *  - Validation errors (e.g., a query included a schema field that doesn't exist)
 *  - Resolver errors (e.g., an error occurred while attempting to populate a query field)
 *
 * @param {Store} store
 * @returns {ApolloLink}
 * @link https://www.apollographql.com/docs/react/data/error-handling
 */
export function handleSubgraphError(store: Store): ApolloLink {
  return onError(({/* graphQLErrors */ networkError}) => {
    if (networkError) {
      const reduxStateNotYetSet =
        (store.getState() as StoreState).subgraphNetworkStatus.status !==
        SubgraphNetworkStatus.ERR;

      if (reduxStateNotYetSet) {
        store.dispatch(
          setSubgraphNetworkStatus({status: SubgraphNetworkStatus.ERR})
        );

        // Show error once
        console.error(`[Subgraph network error]: ${networkError}`);
      }
    }

    // Reset when there's no more network error
    if (!networkError) {
      const reduxStateNotYetSet =
        (store.getState() as StoreState).subgraphNetworkStatus.status !==
        SubgraphNetworkStatus.OK;

      if (reduxStateNotYetSet) {
        store.dispatch(
          setSubgraphNetworkStatus({status: SubgraphNetworkStatus.OK})
        );
      }
    }
  });
}
