import {useEffect, useMemo, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {useSelector} from 'react-redux';

import {GET_ADAPTERS} from '../../../gql';

import {getAdapters} from '../helpers';
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
  registeredAdapters: AdapterType[] | undefined;
  unRegisteredAdapters: Adapters[] | undefined;
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
  const getRegisteredAdapters = useQuery(GET_ADAPTERS, {
    pollInterval: GQL_QUERY_POLLING_INTERVAL,
  });

  /**
   * State
   */
  const [registeredAdapters, setRegisteredAdapters] = useState<
    AdapterType[] | undefined
  >();
  const [unRegisteredAdapters, setUnRegisteredAdapters] = useState<
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

      if (!getRegisteredAdapters.loading && getRegisteredAdapters.data) {
        // get adapters
        const {adapters} = getRegisteredAdapters.data as Record<string, any>;

        // get dao address, must be lowercase due to lower casing of addresses in subgraph
        const daoAddress = DaoRegistryContract.contractAddress.toLowerCase();

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
        const nonRegisteredAdapters = availableAdapters.filter(
          (unused) =>
            !usedAdapters.find(
              (used) =>
                used.adapterId.toLowerCase() === unused.adapterId.toLowerCase()
            )
        );

        usedAdapters.length && setRegisteredAdapters(usedAdapters);
        nonRegisteredAdapters.length &&
          setUnRegisteredAdapters(nonRegisteredAdapters);

        setAdapterStatus(AsyncStatus.FULFILLED);
      } else {
        if (getRegisteredAdapters.error) {
          throw new Error(getRegisteredAdapters.error.message);
        }
      }
    } catch (error) {
      setRegisteredAdapters(undefined);
      setUnRegisteredAdapters(undefined);

      setAdapterStatus(AsyncStatus.REJECTED);
    }
  }, [availableAdapters, DaoRegistryContract, getRegisteredAdapters]);

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
    registeredAdapters,
    unRegisteredAdapters,
  };
}
