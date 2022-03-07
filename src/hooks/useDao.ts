import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';

import {StoreState} from '../store/types';
import {useSelector} from 'react-redux';

import {GET_DAO} from '../gql';

type UseDaoReturn = {
  dao: Record<string, any> | undefined;
  daoError: Error | undefined;
};

/**
 * useDao
 *
 * This component queries The Graph API to get data on the dao
 *
 * @returns {UseDaoReturn}
 */
export function useDao(): UseDaoReturn {
  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  const [getDao, {called, loading, data, error}] = useLazyQuery(GET_DAO, {
    variables: {id: daoRegistryContract?.contractAddress.toLowerCase()},
  });

  const [dao, setDao] = useState<Record<string, any> | undefined>();
  const [daoError, setDaoError] = useState<Error>();

  const getDaoRegistryCallback = useCallback(getDaoRegistry, [
    daoRegistryContract?.contractAddress,
    data,
    error,
  ]);

  useEffect(() => {
    if (!called) {
      getDao();
    }
  }, [called, getDao]);

  useEffect(() => {
    if (called && !loading && daoRegistryContract?.contractAddress) {
      getDaoRegistryCallback();
    }
  }, [
    called,
    daoRegistryContract?.contractAddress,
    getDaoRegistryCallback,
    loading,
  ]);

  function getDaoRegistry() {
    try {
      if (data) {
        if (data.tributeDaos.length === 0) {
          throw new Error(
            `"${daoRegistryContract?.contractAddress}" dao address not found.`
          );
        }

        setDao(data.tributeDaos[0]);
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
      const e = error as Error;

      setDaoError(e);
    }
  }

  return {dao, daoError};
}
