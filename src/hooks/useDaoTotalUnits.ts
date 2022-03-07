import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';
import {useSelector} from 'react-redux';
import {toBN} from 'web3-utils';

import {AsyncStatus} from '../util/types';
import {StoreState} from '../store/types';
import {SubgraphNetworkStatus} from '../store/subgraphNetworkStatus/types';
import {GET_DAO} from '../gql';
import {GUILD_ADDRESS, TOTAL_ADDRESS, UNITS_ADDRESS} from '../config';

type UseDaoTotalUnitsReturn = {
  totalUnits: number | undefined;
  totalUnitsError: Error | undefined;
  totalUnitsIssued: number | undefined;
  totalUnitsStatus: AsyncStatus;
};

/**
 * useDaoTotalUnits
 *
 * Gets DAO (1) total units minted and (2) total units issued and outstanding
 * from subgraph with direct onchain fallback.
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
  const [totalUnitsIssued, setTotalUnitsIssued] = useState<number>();
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
        const {totalUnits, totalUnitsIssued} = data.tributeDaos[0] as Record<
          string,
          any
        >;
        setTotalUnits(Number(totalUnits));
        setTotalUnitsIssued(Number(totalUnitsIssued));
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

      // total units minted for the DAO
      const totalUnitsToSet = await BankExtensionContract.instance.methods
        .balanceOf(TOTAL_ADDRESS, UNITS_ADDRESS)
        .call();
      // balance of units owned by the guild bank
      const balanceOfGuildUnits = await BankExtensionContract.instance.methods
        .balanceOf(GUILD_ADDRESS, UNITS_ADDRESS)
        .call();
      // total units issued and outstanding (not owned by the guild bank)
      const totalUnitsIssuedToSet = toBN(totalUnitsToSet).sub(
        toBN(balanceOfGuildUnits)
      );

      setTotalUnits(Number(totalUnitsToSet));
      setTotalUnitsIssued(Number(totalUnitsIssuedToSet));
      setTotalUnitsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      const e = error as Error;

      console.log(e);
      setTotalUnits(undefined);
      setTotalUnitsIssued(undefined);
      setTotalUnitsError(e);
      setTotalUnitsStatus(AsyncStatus.REJECTED);
    }
  }

  return {totalUnits, totalUnitsError, totalUnitsIssued, totalUnitsStatus};
}
