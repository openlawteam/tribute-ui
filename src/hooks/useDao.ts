import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';

import {StoreState} from '../store/types';
import {useSelector} from 'react-redux';

import {GET_DAO} from '../gql';

type UseDaoReturn = {
  dao: Record<string, any> | undefined;
  gqlError: Error | undefined;
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
  const [gqlError, setGqlError] = useState<Error>();

  const getDaoRegistryCallback = useCallback(getDaoRegistry, [
    daoRegistryContract?.contractAddress,
    data,
    error,
    loading,
  ]);

  useEffect(() => {
    if (!called) {
      getDao();
    }
  }, [called, getDao]);

  useEffect(() => {
    if (!loading && daoRegistryContract?.contractAddress) {
      getDaoRegistryCallback();
    }
  }, [daoRegistryContract?.contractAddress, getDaoRegistryCallback, loading]);

  function getDaoRegistry() {
    try {
      if (!loading && data) {
        setDao(data.molochv3S[0]);

        if (data.molochv3S.length === 0) {
          const error = new Error(
            `"${daoRegistryContract?.contractAddress}" dao address not found.`
          );

          throw error;
        }
      } else {
        if (error) {
          const error = new Error(
            `"${daoRegistryContract?.contractAddress}" is not a valid dao address.`
          );

          throw error;
        }
      }
    } catch (error) {
      setGqlError(error);
    }
  }

  return {dao, gqlError};
}
