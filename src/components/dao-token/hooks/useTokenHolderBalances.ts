import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {useLazyQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {GET_TOKEN_HOLDER_BALANCES} from '../../../gql';

type UseTokenHolderBalancesReturn = {
  tokenHolderBalances: Record<string, any> | undefined;
  gqlError: Error | undefined;
};

/**
 * useTokenHolderBalances
 *
 * This component queries The Graph API to get data on the token holders
 *
 * @returns {UseTokenHolderBalancesReturn}
 */
export function useTokenHolderBalances(): UseTokenHolderBalancesReturn {
  /**
   * Selectors
   */

  const erc20ExtensionContract = useSelector(
    (s: StoreState) => s.contracts?.ERC20ExtensionContract
  );

  const connectedMember = useSelector((s: StoreState) => s.connectedMember);

  /**
   * GQL Query
   */

  const [
    getTokenHolderBalances,
    {called, loading, data, error, startPolling, stopPolling},
  ] = useLazyQuery(GET_TOKEN_HOLDER_BALANCES, {
    variables: {
      tokenAddress: erc20ExtensionContract?.contractAddress.toLowerCase(),
    },
  });

  /**
   * State
   */

  const [tokenHolderBalances, setTokenHolderBalances] = useState<
    Record<string, any> | undefined
  >();
  const [gqlError, setGqlError] = useState<Error>();

  /**
   * Cached callbacks
   */

  const getTokenBalanceCallback = useCallback(getTokenBalance, [
    erc20ExtensionContract?.contractAddress,
    data,
    error,
    loading,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (!called && erc20ExtensionContract?.contractAddress) {
      getTokenHolderBalances();
    }
  }, [called, erc20ExtensionContract?.contractAddress, getTokenHolderBalances]);

  useEffect(() => {
    if (!loading && erc20ExtensionContract?.contractAddress) {
      getTokenBalanceCallback();
    }
  }, [
    erc20ExtensionContract?.contractAddress,
    getTokenBalanceCallback,
    loading,
  ]);

  // When the `SET_CONNECTED_MEMBER` redux action is dispatched in other
  // components (to refetch the connected user's member status info) the
  // `useSelector` hook above will return a new `connectedMember` object. By
  // default, the `useEffect` hook uses a strict equality comparison which will
  // consider the new object a changed value (even if the individual fields are
  // the same from the previous `connectedMember` store state). This change is
  // used to trigger a refresh of the `GET_TOKEN_HOLDER_BALANCES` query result
  // so any change to the connected token holder's balance can be shown in the
  // nav badge without having to do a page reload.
  useEffect(() => {
    // a single refetch may not be enough to catch any token balance change so
    // we poll but only for a short time period
    connectedMember && startPolling && startPolling(2000);

    const pollingTimeoutId = stopPolling && setTimeout(stopPolling, 10000);

    return function cleanup() {
      pollingTimeoutId && clearTimeout(pollingTimeoutId);
    };
  }, [connectedMember, startPolling, stopPolling]);

  /**
   * Functions
   */

  function getTokenBalance() {
    try {
      if (!loading && data) {
        setTokenHolderBalances(data.tokens[0]);
        if (data.tokens.length === 0) {
          const error = new Error(
            `"${erc20ExtensionContract?.contractAddress}" erc20 address not found.`
          );
          throw error;
        }
      } else {
        if (error) {
          const error = new Error(
            `"${erc20ExtensionContract?.contractAddress}" is not a valid erc20 address.`
          );

          throw error;
        }
      }
    } catch (error) {
      setGqlError(error);
    }
  }

  return {tokenHolderBalances, gqlError};
}
