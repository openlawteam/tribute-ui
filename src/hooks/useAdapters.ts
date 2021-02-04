import {useEffect, useState} from 'react';
// import Web3 from 'web3';

import {apolloClient} from '../index';
import {GET_ADAPTERS} from '../gql';

import {useDao} from './';

type AdapterType = {
  __typename: string;
  id: string;
  acl: string;
  adapterAddress: string;
};

type UseAdaptersReturn = {
  adapters: AdapterType[] | undefined;
};

/**
 * useDao
 *
 * This component queries The Graph API to get the daos adapters
 *
 * @returns {UseAdaptersReturn}
 */
export function useAdapters(): UseAdaptersReturn {
  /**
   * Our hooks
   */

  const {dao} = useDao();

  /**
   * State
   */
  const [adapters, setAdapters] = useState<AdapterType[] | undefined>();

  useEffect(() => {
    if (!apolloClient) return;
    if (!dao) return;

    apolloClient
      .query({
        query: GET_ADAPTERS,
      })
      .then(({data}: Record<string, any>) => {
        const {
          data: {laolands},
        } = dao;
        const {daoAddress} = laolands[0];

        const daoAdapters = data.adapters.filter(
          (adapter: AdapterType) => adapter.id.startsWith(daoAddress) && adapter
        );

        // let sha3 = Web3.utils.hexToUtf8(
        //   '0x33c50675c08bf6495444473b20b4c359e484c6bf5c6999f6256e86bf7bb08b2b'
        // );
        // console.log('sha3', sha3);
        daoAdapters.length && setAdapters(daoAdapters);
      })
      .catch((error) => {
        console.log('error', error);
      });
  }, [dao]);

  return {adapters};
}
