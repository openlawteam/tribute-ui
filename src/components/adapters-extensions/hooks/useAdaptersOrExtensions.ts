import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';
import {useSelector} from 'react-redux';

import {StoreState} from '../../../store/types';
import {AsyncStatus} from '../../../util/types';
import {Adapters, Extensions} from '../types';

import {GET_ADAPTERS_AND_EXTENSIONS} from '../../../gql';

import {
  defaultAdaptersAndExtensions,
  AdaptersAndExtensionsType,
} from '../config';
import {GQL_QUERY_POLLING_INTERVAL} from '../../../config';

import {DaoConstants} from '../enums';

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

type UseAdaptersOrExtensionsReturn = {
  adapterStatus: AsyncStatus;
  getAdapterFromRedux: (adapterName: DaoConstants) => Record<string, any>;
  registeredAdapters: AdapterType[] | undefined;
  unRegisteredAdapters: Adapters[] | undefined;
};

export type AdaptersType = AdapterType & Adapters;
export type ExtensionsType = ExtensionType & Extensions;

/**
 * useAdaptersOrExtensions
 *
 * This component queries The Graph API to get the daos adapters.
 * It returns the available adapters filtered by a search on the current dao.
 *
 * @returns {UseAdaptersOrExtensionsReturn}
 */
export function useAdaptersOrExtensions(): UseAdaptersOrExtensionsReturn {
  /**
   * Selectors
   */
  const {DaoRegistryContract, ...adapterContracts} = useSelector(
    (s: StoreState) => s.contracts
  );

  /**
   * Their hooks
   */
  const [
    getRegisteredAdaptersAndExtensions,
    {called, loading, data, error},
  ] = useLazyQuery(GET_ADAPTERS_AND_EXTENSIONS, {
    pollInterval: GQL_QUERY_POLLING_INTERVAL,
    variables: {daoAddress: DaoRegistryContract?.contractAddress.toLowerCase()},
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

  const getAdaptersAndExtensionsCached = useCallback(
    getAdaptersAndExtensions,
    []
  );

  useEffect(() => {
    if (!called) {
      getRegisteredAdaptersAndExtensions();
    }
  }, [called, getRegisteredAdaptersAndExtensions]);

  // Get adapters and extensions from GQL
  useEffect(() => {
    if (!DaoRegistryContract?.contractAddress) return;

    try {
      setAdapterStatus(AsyncStatus.PENDING);

      if (data) {
        // extract adapters and extensions from gql data
        const {adapters, extensions} = data.molochv3S[0] as Record<string, any>;

        // create a list of registered and un-registered adapters and extensions
        const {
          registeredList,
          unRegisteredList,
        } = getAdaptersAndExtensionsCached(adapters, extensions);

        setRegisteredAdapters(registeredList);
        setUnRegisteredAdapters(unRegisteredList);

        // done; lets set status to fulfilled
        setAdapterStatus(AsyncStatus.FULFILLED);
      } else {
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      setRegisteredAdapters(undefined);
      setUnRegisteredAdapters(undefined);

      setAdapterStatus(AsyncStatus.REJECTED);
    }
  }, [
    DaoRegistryContract,
    called,
    data,
    error,
    getAdaptersAndExtensionsCached,
    loading,
  ]);

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
          let shouldSkip = false;

          // Check options for adapters and extensions
          adapterOrExtension?.options?.forEach((option: any) => {
            if (shouldSkip) {
              return;
            }

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

                shouldSkip = true;
                return;
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

                shouldSkip = true;
                return;
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
