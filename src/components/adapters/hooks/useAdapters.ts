import {useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {useSelector} from 'react-redux';

import {GET_ADAPTERS} from '../../../gql';

import {getAdapters, Adapters} from '../config';

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
  usedAdapters: AdapterType[] | undefined;
  unusedAdapters: Adapters[] | undefined;
  getDaoAdapters: () => void;
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
  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  /**
   * Their hooks
   */
  const getUsedAdapters = useQuery(GET_ADAPTERS);

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
  const availableAdapters: Adapters[] = [...getAdapters()];

  function getDaoAdapters() {
    if (!daoRegistryContract?.contractAddress) return;

    try {
      setAdapterStatus(AsyncStatus.PENDING);
      if (!getUsedAdapters.loading && getUsedAdapters.data) {
        // get dao address
        const daoAddress = daoRegistryContract.contractAddress;

        // get all availables adapters for the dao
        const daoAdapters: [] = getUsedAdapters.data.adapters.filter(
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
      // setError(error);
      setAdapterStatus(AsyncStatus.REJECTED);
    }
  }

  return {
    availableAdapters,
    usedAdapters: adapters,
    unusedAdapters,
    getDaoAdapters,
    adapterStatus,
  };
}
