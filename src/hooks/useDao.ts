import {useEffect, useState} from 'react';

import {StoreState} from '../store/types';
import {useSelector} from 'react-redux';

import {apolloClient} from '../index';
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

  const [dao, setDao] = useState<Record<string, any> | undefined>();

  useEffect(() => {
    if (!apolloClient) return;
    if (!daoRegistryContract) return;

    apolloClient
      .query({
        query: GET_DAO,
        variables: {
          id: daoRegistryContract.contractAddress,
        },
      })
      .then((result: Record<string, any>) => {
        console.log(result);
        setDao(result);
      })
      .catch((error) => {
        console.log('error', error);
      });
  }, [daoRegistryContract]);

  return {dao};
}
