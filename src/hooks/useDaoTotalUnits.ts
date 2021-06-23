import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../util/types';
import {StoreState} from '../store/types';
import {SubgraphNetworkStatus} from '../store/subgraphNetworkStatus/types';
import {GET_DAO} from '../gql';
import {
  GQL_QUERY_POLLING_INTERVAL,
  TOTAL_ADDRESS,
  UNITS_ADDRESS,
} from '../config';

type UseDaoTotalUnitsReturn = {
  totalUnits: number | undefined;
  totalUnitsError: Error | undefined;
  totalUnitsStatus: AsyncStatus;
};

/**
 * useDaoTotalUnits
 *
 * Gets DAO total units from subgraph with direct onchain fallback.
 *
 * @returns {UseDaoTotalUnitsReturn}
 */
export function useDaoTotalUnits(): UseDaoTotalUnitsReturn {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract
  );
  const BankExtensionContract = useSelector(
    (state: StoreState) => state.contracts.BankExtensionContract
  );
  const subgraphNetworkStatus = useSelector(
    (state: StoreState) => state.subgraphNetworkStatus.status
  );

  /**
   * GQL Query
   */

  const [
    getDaoFromSubgraphResult,
    {called, loading, data, error, stopPolling},
  ] = useLazyQuery(GET_DAO, {
    pollInterval: GQL_QUERY_POLLING_INTERVAL,
    variables: {
      id: DaoRegistryContract?.contractAddress.toLowerCase(),
    },
  });

  /**
   * State
   */

  const [totalUnits, setTotalUnits] = useState<number>();
  const [totalUnitsStatus, setTotalUnitsStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );
  const [totalUnitsError, setTotalUnitsError] = useState<Error>();

  /**
   * Cached callbacks
   */

  const getTotalUnitsFromExtensionCached = useCallback(
    getTotalUnitsFromExtension,
    [BankExtensionContract]
  );

  const getTotalUnitsFromSubgraphCached = useCallback(
    getTotalUnitsFromSubgraph,
    [data, error, getTotalUnitsFromExtensionCached, loading, stopPolling]
  );

  /**
   * Effects
   */

  useEffect(() => {
    if (!called) {
      getDaoFromSubgraphResult();
    }
  }, [called, getDaoFromSubgraphResult]);

  useEffect(() => {
    if (subgraphNetworkStatus === SubgraphNetworkStatus.OK) {
      if (!loading && DaoRegistryContract?.contractAddress) {
        getTotalUnitsFromSubgraphCached();
      }
    } else {
      // If there is a subgraph network error fallback to fetching totalUnits
      // directly from smart contract
      stopPolling && stopPolling();
      getTotalUnitsFromExtensionCached();
    }
  }, [
    DaoRegistryContract?.contractAddress,
    getTotalUnitsFromExtensionCached,
    getTotalUnitsFromSubgraphCached,
    loading,
    stopPolling,
    subgraphNetworkStatus,
  ]);

  /**
   * Functions
   */

  function getTotalUnitsFromSubgraph() {
    try {
      setTotalUnitsStatus(AsyncStatus.PENDING);

      if (!loading && data) {
        // extract totalUnits from gql data
        const {totalUnits} = data.tributeDaos[0] as Record<string, any>;
        setTotalUnits(Number(totalUnits));
        setTotalUnitsStatus(AsyncStatus.FULFILLED);
      } else {
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      // If there is a subgraph query error fallback to fetching totalUnits
      // directly from smart contract
      console.log(`subgraph query error: ${error.message}`);
      stopPolling && stopPolling();
      getTotalUnitsFromExtensionCached();
    }
  }

  async function getTotalUnitsFromExtension() {
    if (!BankExtensionContract) {
      return;
    }

    try {
      setTotalUnitsStatus(AsyncStatus.PENDING);

      const totalUnits = await BankExtensionContract.instance.methods.balanceOf(
        TOTAL_ADDRESS,
        UNITS_ADDRESS
      );

      setTotalUnits(Number(totalUnits));
      setTotalUnitsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      console.log(error);
      setTotalUnits(undefined);
      setTotalUnitsError(error);
      setTotalUnitsStatus(AsyncStatus.REJECTED);
    }
  }

  return {totalUnits, totalUnitsError, totalUnitsStatus};
}
