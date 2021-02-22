import {useCallback, useEffect, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

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

  const getDao = useQuery(GET_DAO, {
    variables: {id: daoRegistryContract?.contractAddress.toLowerCase()},
  });

  const [dao, setDao] = useState<Record<string, any> | undefined>();
  const [gqlError, setGqlError] = useState<Error>();

  const getDaoRegistryCallback = useCallback(getDaoRegistry, [
    daoRegistryContract?.contractAddress,
    getDao,
  ]);

  useEffect(() => {
    if (!getDao.loading && daoRegistryContract?.contractAddress) {
      getDaoRegistryCallback();
    }
  }, [
    getDao.loading,
    daoRegistryContract?.contractAddress,
    getDaoRegistryCallback,
  ]);

  function getDaoRegistry() {
    try {
      if (!getDao.loading && getDao.data) {
        setDao(getDao.data.laolands[0]);

        if (getDao.data.laolands.length === 0) {
          const error = new Error(
            `"${daoRegistryContract?.contractAddress}" dao address not found.`
          );

          throw error;
        }
      } else {
        if (getDao.error) {
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
