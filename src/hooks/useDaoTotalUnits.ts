import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../util/types';
import {StoreState} from '../store/types';
import {SubgraphNetworkStatus} from '../store/subgraphNetworkStatus/types';
import {GET_DAO} from '../gql';
import {TOTAL_ADDRESS, UNITS_ADDRESS} from '../config';

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

  const [getDaoFromSubgraphResult, {called, loading, data, error}] =
    useLazyQuery(GET_DAO, {
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
    [data, error, getTotalUnitsFromExtensionCached]
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
      if (called && !loading && DaoRegistryContract?.contractAddress) {
        getTotalUnitsFromSubgraphCached();
      }
    } else {
      // If there is a subgraph network error fallback to fetching totalUnits
      // directly from smart contract
      getTotalUnitsFromExtensionCached();
    }
  }, [
    DaoRegistryContract?.contractAddress,
    called,
    getTotalUnitsFromExtensionCached,
    getTotalUnitsFromSubgraphCached,
    loading,
    subgraphNetworkStatus,
  ]);

  /**
   * Functions
   */

  function getTotalUnitsFromSubgraph() {
    try {
      setTotalUnitsStatus(AsyncStatus.PENDING);

      if (data) {
        // extract totalUnits from gql data
        const {totalUnits} = data.tributeDaos[0] as Record<string, any>;
        setTotalUnits(Number(totalUnits));
        setTotalUnitsStatus(AsyncStatus.FULFILLED);
      } else {
        if (error) {
          throw new Error(`subgraph query error: ${error.message}`);
        } else if (typeof data === 'undefined') {
          // Additional case to catch `{"errors":{"message":"No indexers found
          // for subgraph deployment"}}` which does not get returned as an error
          // by the graph query call.
          throw new Error('subgraph query error: data is undefined');
        }
      }
    } catch (error) {
      const {message} = error as Error;

      // If there is a subgraph query error fallback to fetching totalUnits
      // directly from smart contract
      console.log(message);

      getTotalUnitsFromExtensionCached();
    }
  }

  async function getTotalUnitsFromExtension() {
    if (!BankExtensionContract) {
      return;
    }

    try {
      setTotalUnitsStatus(AsyncStatus.PENDING);

      const totalUnits = await BankExtensionContract.instance.methods
        .balanceOf(TOTAL_ADDRESS, UNITS_ADDRESS)
        .call();

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
