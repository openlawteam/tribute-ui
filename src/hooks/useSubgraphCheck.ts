import {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useLazyQuery} from '@apollo/react-hooks';

import {StoreState} from '../store/types';
import {GET_DAO} from '../gql';
import {GRAPH_API_URL} from '../config';
import {AsyncStatus} from '../util/types';

type UseSubgraphCheck = {
  subgraphIsResponding: boolean;
  isSubgraphCheckDone: boolean;
};

/**
 * useMembers
 *
 * @returns `UseSubgraphCheck` An object with the status of the subgraph.
 */
export function useSubgraphCheck(): UseSubgraphCheck {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );

  /**
   * GQL Query
   */

  const [getDao, {called, loading, data, error}] = useLazyQuery(GET_DAO, {
    variables: {id: DaoRegistryContract?.contractAddress.toLowerCase()},
  });

  /**
   * State
   */

  const [subgraphIsResponding, setSubgraphIsResponding] = useState<boolean>(
    false
  );
  const [subgraphCheckStatus, setSubgraphCheckStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Effects
   */

  useEffect(() => {
    try {
      setSubgraphCheckStatus(AsyncStatus.PENDING);

      if (!DaoRegistryContract?.contractAddress) return;

      if (!GRAPH_API_URL) {
        throw new Error('No Graph API URL detected.');
      }

      if (!called) {
        getDao();
      }

      if (!loading && data) {
        setSubgraphCheckStatus(AsyncStatus.FULFILLED);
        setSubgraphIsResponding(true);
      } else {
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      setSubgraphCheckStatus(AsyncStatus.REJECTED);
      setSubgraphIsResponding(false);
      console.log(error.message);
    }
  }, [
    DaoRegistryContract?.contractAddress,
    called,
    data,
    error,
    getDao,
    loading,
  ]);

  /**
   * Variables
   */

  const isSubgraphCheckDone =
    subgraphCheckStatus === AsyncStatus.FULFILLED ||
    subgraphCheckStatus === AsyncStatus.REJECTED;

  return {subgraphIsResponding, isSubgraphCheckDone};
}
