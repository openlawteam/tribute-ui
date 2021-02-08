import {useCallback, useEffect, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../store/types';
import {useSelector} from 'react-redux';

import {GET_DAO} from '../gql';

type UseDaoReturn = {
  dao: Record<string, any> | undefined;
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
    variables: {id: daoRegistryContract?.contractAddress},
  });

  const [dao, setDao] = useState<Record<string, any> | undefined>();

  const getDaoRegistryCallback = useCallback(getDaoRegistry, [getDao]);

  useEffect(() => {
    if (!getDao.loading) {
      getDaoRegistryCallback();
    }
  }, [getDao.loading, getDaoRegistryCallback]);

  function getDaoRegistry() {
    try {
      if (!getDao.loading && getDao.data) {
        setDao(getDao.data);
      } else {
        if (getDao.error) {
          throw new Error(getDao.error.message);
        }
      }
    } catch (error) {
      // setError(error);
    }
  }
  console.log('dao', dao);
  return {dao};
}
