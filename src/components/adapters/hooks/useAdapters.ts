import {useEffect, useMemo, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {useSelector} from 'react-redux';

import {GET_ADAPTERS} from '../../../gql';

import {getAdapters} from '../config';
import {Adapters} from '../types';
import {DaoConstants} from '../enums';
import {GQL_QUERY_POLLING_INTERVAL} from '../../../config';

export type AdapterType = {
  __typename: string;
  id: string;
  acl: string;
  adapterId: string;
  adapterAddress: string;
};

type UseAdaptersReturn = {
  adapterStatus: AsyncStatus;
  availableAdapters: Adapters[];
  getAdapter: (adapterName: DaoConstants) => Record<string, any>;
  unusedAdapters: Adapters[] | undefined;
  usedAdapters: AdapterType[] | undefined;
};

export type AdaptersType = AdapterType & Adapters;

/**
 * useAdapters
 *
 * This component queries The Graph API to get the daos adapters.
 * It returns the available adapters filtered by a search on the current dao.
 *
 * @returns {UseAdaptersReturn}
 */
export function useAdapters(): UseAdaptersReturn {
  /**
   * Selectors
   */
  const {DaoRegistryContract, ...adapterContracts} = useSelector(
    (s: StoreState) => s.contracts
  );

  /**
   * Their hooks
   */
  const getUsedAdapters = useQuery(GET_ADAPTERS, {
    pollInterval: GQL_QUERY_POLLING_INTERVAL,
  });

  /**
   * State
   */
  const [adapters, setAdapters] = useState<AdapterType[] | undefined>();
  const [unusedAdapters, setUnusedAdapters] = useState<
    Adapters[] | undefined
  >();
  const [adapterStatus, setAdapterStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Variables
   */
  // Memoize calling `getAdapters` because it's an expensive
  // operation and because eslint-plugin-react-hooks was complaining :)
  const availableAdapters: Adapters[] = useMemo(() => getAdapters(), []);

  // Get GQL adapters
  useEffect(() => {
    if (!DaoRegistryContract?.contractAddress) return;

    try {
      setAdapterStatus(AsyncStatus.PENDING);

      if (!getUsedAdapters.loading && getUsedAdapters.data) {
        // get adapters
        const {adapters} = getUsedAdapters.data as Record<string, any>;

        // get dao address
        const daoAddress = DaoRegistryContract.contractAddress;

        // get all availables adapters for the dao
        const daoAdapters: [] = adapters.filter(
          (adapter: AdapterType) => adapter.id.startsWith(daoAddress) && adapter
        );

        let usedAdapters: AdaptersType[] = [];

        // assign the adapter name for each used adapter
        daoAdapters.forEach((a: AdapterType) => {
          const adapter: Adapters | undefined = availableAdapters.find(
            (aa: Adapters) =>
              aa.adapterId?.toLowerCase() === a.adapterId?.toLowerCase() &&
              aa.adapterName
          );

          if (adapter) {
            usedAdapters.push({
              ...a,
              adapterName: adapter.adapterName,
              adapterDescription: adapter.adapterDescription,
            });
          }
        });

        // add any unused adapters
        const unusedAdapters = availableAdapters.filter(
          (unused) =>
            !usedAdapters.find((used) => used.adapterId === unused.adapterId)
        );

        usedAdapters.length && setAdapters(usedAdapters);
        unusedAdapters.length && setUnusedAdapters(unusedAdapters);

        setAdapterStatus(AsyncStatus.FULFILLED);
      } else {
        if (getUsedAdapters.error) {
          throw new Error(getUsedAdapters.error.message);
        }
      }
    } catch (error) {
      setAdapters(undefined);
      setUnusedAdapters(undefined);
      setAdapterStatus(AsyncStatus.REJECTED);
    }
  }, [availableAdapters, DaoRegistryContract, getUsedAdapters]);

  /**
   * getAdapter
   *
   * @param adapterName DaoConstants
   */
  function getAdapter(adapterName: DaoConstants): Record<string, any> {
    return Object.keys(adapterContracts)
      .map((a) => adapterContracts[a])
      .filter((a) => a) // filter out any `null` adapter objects
      .filter((a) => a.adapterName === adapterName)[0];
  }

  return {
    adapterStatus,
    availableAdapters,
    getAdapter,
    unusedAdapters,
    usedAdapters: adapters,
  };
}
