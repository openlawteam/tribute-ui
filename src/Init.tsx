import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {getApiStatus as getSnapshotAPIStatus} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from './util/types';
import {getConnectedMember} from './store/actions';
import {ReduxDispatch, StoreState} from './store/types';
import {SNAPSHOT_HUB_API_URL} from './config';
import {useInitContracts, useIsDefaultChain} from './components/web3/hooks';
import {useIsMounted} from './hooks';
import {useWeb3Modal} from './components/web3/hooks';

type InitPropsRenderProps = {
  error: Error | undefined;
  isInitComplete: boolean;
};

type InitProps = {
  render: (p: InitPropsRenderProps) => React.ReactElement | null;
};

/**
 * Register any new async process names here.
 * It is mainly to check their progress before rendering.
 *
 * If the app is not dependent on a process before starting
 * do not add it here.
 */
enum ProcessName {
  initSnapshotAPI = 'initSnapshotAPI',
}

/**
 * Init Component
 *
 * Init will run any designated sync/async
 * setup processes and then render any child component
 * upon completion.
 *
 * In our case the children prop component to render is our app.
 *
 * @param {InitProps} props
 */
export default function Init(props: InitProps) {
  const {render} = props;

  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );
  const bankExtensionContract = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract
  );

  /**
   * State
   */

  const [error, setError] = useState<Error>();
  const [isInitComplete, setIsInitComplete] = useState<boolean>(false);
  const [processReadyMap, setProcessReadyMap] = useState<
    Record<ProcessName, AsyncStatus>
  >({
    [ProcessName.initSnapshotAPI]: AsyncStatus.STANDBY,
  });

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();
  const {isDefaultChain} = useIsDefaultChain();
  const {isMountedRef} = useIsMounted();
  const initContracts = useInitContracts();

  /**
   * Their hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Cached callbacks
   */

  const handleInitContractsCached = useCallback(handleInitContracts, [
    initContracts,
    isDefaultChain,
    web3Instance,
  ]);

  const handleGetMemberCached = useCallback(handleGetMember, [
    account,
    bankExtensionContract,
    daoRegistryContract,
    dispatch,
    isDefaultChain,
    web3Instance,
  ]);

  const handleGetSnapshotAPIStatusCached = useCallback(
    handleGetSnapshotAPIStatus,
    [isMountedRef]
  );

  /**
   * Effects
   */

  useEffect(() => {
    setIsInitComplete(
      Object.values(processReadyMap).every((fs) => fs === AsyncStatus.FULFILLED)
    );
  }, [processReadyMap]);

  useEffect(() => {
    handleInitContractsCached();
  }, [handleInitContractsCached, web3Instance]);

  useEffect(() => {
    handleGetMemberCached();
  }, [handleGetMemberCached]);

  useEffect(() => {
    handleGetSnapshotAPIStatusCached();
  }, [handleGetSnapshotAPIStatusCached]);

  /**
   * Functions
   */

  async function handleGetSnapshotAPIStatus() {
    try {
      if (!SNAPSHOT_HUB_API_URL) {
        throw new Error('No Snapshot Hub API URL was found.');
      }

      const {data} = await getSnapshotAPIStatus(SNAPSHOT_HUB_API_URL);

      // Choosing a slice of the data to make sure we have a response, not just 200 OK.
      if (!data.version) {
        throw new Error('Snapshot API is not ready.');
      }

      if (!isMountedRef.current) return;

      setProcessReadyMap((p) => ({
        ...p,
        [ProcessName.initSnapshotAPI]: AsyncStatus.FULFILLED,
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      setError(new Error('Snapshot API is not responding.'));
    }
  }

  async function handleInitContracts() {
    try {
      if (!isDefaultChain || !web3Instance) {
        return;
      }

      await initContracts({web3Instance});
    } catch (error) {
      setError(error);
    }
  }

  async function handleGetMember() {
    try {
      if (
        !account ||
        !daoRegistryContract ||
        !bankExtensionContract ||
        !isDefaultChain ||
        !web3Instance
      ) {
        return;
      }

      await dispatch(
        getConnectedMember({
          account,
          daoRegistryContract,
          bankExtensionContract,
          web3Instance,
        })
      );
    } catch (error) {
      setError(error);
    }
  }

  // Render children
  return render({error, isInitComplete});
}
