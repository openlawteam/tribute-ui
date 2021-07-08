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
    (state: StoreState) => state.contracts?.ERC20ExtensionContract
  );

  const connectedMemberUnits = useSelector(
    (s: StoreState) => s.connectedMember?.units
  );

  const [getTokenHolderBalances, {called, loading, data, error, refetch}] =
    useLazyQuery(GET_TOKEN_HOLDER_BALANCES, {
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
    if (!called) {
      getTokenHolderBalances();
    }
  }, [called, getTokenHolderBalances]);

  useEffect(() => {
    if (!loading && erc20ExtensionContract?.contractAddress) {
      getTokenBalanceCallback();
    }
  }, [
    erc20ExtensionContract?.contractAddress,
    getTokenBalanceCallback,
    loading,
  ]);

  // If the connected user's UNIT balance changes then refresh query result so
  // the token holder balance is also updated without having to do a page
  // reload.
  useEffect(() => {
    refetch && refetch();
  }, [connectedMemberUnits, refetch]);

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
