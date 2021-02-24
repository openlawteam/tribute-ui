import {useEffect, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {useSelector} from 'react-redux';

import {GET_ADAPTERS_AND_EXTENSIONS} from '../../../gql';

import {defaultAdaptersAndExtensions} from '../config';
import {Adapters, Extensions} from '../types';
import {DaoConstants} from '../enums';
import {GQL_QUERY_POLLING_INTERVAL} from '../../../config';

export type AdapterType = {
  __typename: string;
  id: string;
  acl: string;
  adapterId: string;
  adapterAddress: string;
};

export type ExtensionType = {
  __typename: string;
  id: string;
  extensionId: string;
  extensionAddress: string;
};

type UseAdaptersReturn = {
  adapterStatus: AsyncStatus;
  getAdapterFromRedux: (adapterName: DaoConstants) => Record<string, any>;
  registeredAdapters: AdapterType[] | undefined;
  unRegisteredAdapters: Adapters[] | undefined;
};

export type AdaptersType = AdapterType & Adapters;
export type ExtensionsType = ExtensionType & Extensions;

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
  const getRegisteredAdaptersAndExtensions = useQuery(
    GET_ADAPTERS_AND_EXTENSIONS,
    {
      pollInterval: GQL_QUERY_POLLING_INTERVAL,
    }
  );

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

  // Get adapters and extensions from GQL
  useEffect(() => {
    if (!DaoRegistryContract?.contractAddress) return;

    try {
      setAdapterStatus(AsyncStatus.PENDING);

      if (
        !getRegisteredAdaptersAndExtensions.loading &&
        getRegisteredAdaptersAndExtensions.data
      ) {
        // extract adapters and extensions from gql data
        const {
          adapters,
          extensions,
        } = getRegisteredAdaptersAndExtensions.data as Record<string, any>;

        // get dao address, must be lowercase due to lower casing of addresses in subgraph
        const daoAddress = DaoRegistryContract.contractAddress.toLowerCase();
        // get all registered adapters for the dao
        const daoAdapters: [] = adapters.filter(
          (adapter: AdapterType) => adapter.id.startsWith(daoAddress) && adapter
        );
        // get all registered extensions for the dao
        const daoExtensions: [] = extensions.filter(
          (extension: ExtensionType) =>
            extension.id.startsWith(daoAddress) && extension
        );

        // find adapter props from the `defaultAdaptersAndExtensions` object
        const {registeredAdapters, unRegisteredAdapters} = getAdapters(
          daoAdapters
        );

        // find extension props from the `defaultAdaptersAndExtensions` object
        const {registeredExtensions, unRegisteredExtensions} = getExtensions(
          daoExtensions
        );

        // @todo if there is a list need to find
        // un/registered to show radio button options

        const registeredAandE = [
          ...registeredAdapters,
          ...registeredExtensions,
        ];
        const unRegisteredAandE = [
          ...unRegisteredAdapters,
          ...unRegisteredExtensions,
        ];

        registeredAandE.length && setRegisteredAdapters(registeredAandE);
        unRegisteredAandE.length && setUnRegisteredAdapters(unRegisteredAandE);

        // done; set status to fulfilled
        setAdapterStatus(AsyncStatus.FULFILLED);
      } else {
        if (getRegisteredAdaptersAndExtensions.error) {
          throw new Error(getRegisteredAdaptersAndExtensions.error.message);
        }
      }
    } catch (error) {
      setRegisteredAdapters(undefined);
      setUnRegisteredAdapters(undefined);

      setAdapterStatus(AsyncStatus.REJECTED);
    }
  }, [DaoRegistryContract, getRegisteredAdaptersAndExtensions]);

  /**
   * getAdapters
   *
   * Find all registered and un-registered adapters
   * @param daoAdapters
   */
  function getAdapters(daoAdapters: any): Record<string, any> {
    //@todo types
    let registeredAdapters: AdaptersType[] = [];

    // add registered adapters
    daoAdapters.forEach((a: AdapterType) => {
      const adapter: Adapters | undefined = defaultAdaptersAndExtensions.find(
        (aa: Adapters) =>
          aa.adapterId?.toLowerCase() === a.adapterId?.toLowerCase() && aa.name
      );

      if (adapter) {
        registeredAdapters.push({
          ...a,
          name: adapter.name,
          description: adapter.description,
        });
      }
    });

    // add any un-registered adapters
    const unRegisteredAdapters = defaultAdaptersAndExtensions.filter(
      (unused: any) => {
        return (
          !unused?.isExtension &&
          !registeredAdapters.find(
            (used) =>
              used.adapterId?.toLowerCase() === unused.adapterId?.toLowerCase()
          )
        );
      }
    );

    return {
      registeredAdapters,
      unRegisteredAdapters,
    };
  }

  /**
   * getExtensions
   *
   * Find all registered and un-registered extensions
   * @param daoExtensions
   */
  function getExtensions(daoExtensions: any): Record<string, any> {
    // @todo
    let registeredExtensions: ExtensionsType[] = [];

    // add registered extensions
    daoExtensions.forEach((e: ExtensionType) => {
      const extension:
        | Extensions
        | undefined = defaultAdaptersAndExtensions.find(
        (ee: Extensions) =>
          ee.extensionId?.toLowerCase() === e.extensionId?.toLowerCase() &&
          ee.name
      );

      if (extension) {
        registeredExtensions.push({
          ...e,
          name: extension.name,
          description: extension.description,
        });
      }
    });

    // add any un-registered extensions
    const unRegisteredExtensions = defaultAdaptersAndExtensions.filter(
      (unused: any) => {
        return (
          unused?.isExtension &&
          !registeredExtensions.find((used) => {
            return (
              used.extensionId.toLowerCase() ===
                unused.extensionId.toLowerCase() && unused.isExtension
            );
          })
        );
      }
    );

    return {
      registeredExtensions,
      unRegisteredExtensions,
    };
  }

  /**
   * getAdapterFromRedux
   *
   * @param adapterName DaoConstants
   */
  function getAdapterFromRedux(adapterName: DaoConstants): Record<string, any> {
    return Object.keys(adapterContracts)
      .map((a) => adapterContracts[a])
      .filter((a) => a) // filter out any `null` adapter objects
      .filter((a) => a.adapterName === adapterName)[0];
  }

  return {
    adapterStatus,
    getAdapterFromRedux,
    registeredAdapters,
    unRegisteredAdapters,
  };
}
