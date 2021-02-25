import {useEffect, useState} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {useSelector} from 'react-redux';

import {GET_ADAPTERS_AND_EXTENSIONS} from '../../../gql';

import {
  defaultAdaptersAndExtensions,
  AdaptersAndExtensionsType,
} from '../config';
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
        // get all registered adapters for the searched dao address
        const daoAdapters: [] = adapters.filter(
          (adapter: AdapterType) => adapter.id.startsWith(daoAddress) && adapter
        );
        // get all registered extensions for the searched dao address
        const daoExtensions: [] = extensions.filter(
          (extension: ExtensionType) =>
            extension.id.startsWith(daoAddress) && extension
        );

        // create a list of registered and un-registered adapters and extensions
        const {registeredList, unRegisteredList} = getAdaptersAndExtensions(
          daoAdapters,
          daoExtensions
        );

        setRegisteredAdapters(registeredList);
        setUnRegisteredAdapters(unRegisteredList);

        // done; lets set status to fulfilled
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
  function getAdaptersAndExtensions(
    daoAdapters: any,
    daoExtensions: any
  ): Record<string, any> {
    //@todo types

    let registeredList: AdaptersAndExtensionsType[] = [];
    let unRegisteredList: AdaptersAndExtensionsType[] = [];

    const getAdapterFromGql = (adapterId: string) => {
      return daoAdapters.find((adapter: AdaptersAndExtensionsType) => {
        return adapter.adapterId?.toLowerCase() === adapterId?.toLowerCase();
      });
    };

    const getExtensionFromGql = (extensionId: string) => {
      return daoExtensions.find((extension: AdaptersAndExtensionsType) => {
        return (
          extension.extensionId?.toLowerCase() === extensionId?.toLowerCase()
        );
      });
    };

    defaultAdaptersAndExtensions.forEach(
      (adapterOrExtension: AdaptersAndExtensionsType | any) => {
        if (adapterOrExtension?.isExtension) {
          // Add an extenaion
          const gqlExtension = getExtensionFromGql(
            adapterOrExtension.extensionId
          );

          if (gqlExtension) {
            registeredList.push({
              ...gqlExtension,
              name: adapterOrExtension.name as DaoConstants,
              description: adapterOrExtension.description,
            } as AdaptersAndExtensionsType);
          } else {
            unRegisteredList.push({
              ...adapterOrExtension,
              name: adapterOrExtension.name as DaoConstants,
              description: adapterOrExtension.description,
            } as AdaptersAndExtensionsType);
          }
        } else if (adapterOrExtension?.options) {
          // Check options for adapters and extensions

          adapterOrExtension?.options?.forEach((option: any) => {
            if (option?.isExtension) {
              const gqlExtension = getExtensionFromGql(option.extensionId);
              if (gqlExtension) {
                // @todo for now we are adding all found options that match the register
                // need to check which adapter contract type was added to de-dupe
                registeredList.push({
                  ...gqlExtension,
                  name: option.name as DaoConstants,
                  description: option.description,
                } as AdaptersAndExtensionsType);
              } else {
                unRegisteredList.push({
                  ...option,
                  name: option.name as DaoConstants,
                  description: option.description,
                } as AdaptersAndExtensionsType);
              }
            } else {
              const gqlAdapter = getAdapterFromGql(option.adapterId);
              if (gqlAdapter) {
                // @todo for now we are adding all found options that match the register
                // need to check which adapter contract type was added to de-dupe
                registeredList.push({
                  ...gqlAdapter,
                  name: option.name as DaoConstants,
                  description: option.description,
                } as AdaptersAndExtensionsType);
              } else {
                unRegisteredList.push({
                  ...option,
                  name: option.name as DaoConstants,
                  description: option.description,
                } as AdaptersAndExtensionsType);
              }
            }
          });
        } else {
          // Add an adapter
          const gqlAdapter = getAdapterFromGql(adapterOrExtension.adapterId);

          if (gqlAdapter) {
            registeredList.push({
              ...gqlAdapter,
              name: adapterOrExtension.name as DaoConstants,
              description: adapterOrExtension.description,
            } as AdaptersAndExtensionsType);
          } else {
            unRegisteredList.push({
              ...adapterOrExtension,
              name: adapterOrExtension.name as DaoConstants,
              description: adapterOrExtension.description,
            } as AdaptersAndExtensionsType);
          }
        }
      }
    );

    // console.log('registeredList', registeredList);
    // console.log('unRegisteredList', unRegisteredList);

    return {
      registeredList,
      unRegisteredList,
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
