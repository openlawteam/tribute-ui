import {useReducer, useCallback, useEffect} from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_CHAIN} from '../../../config';
import {NetworkNames, NetworkIDs} from '../../../util/enums';

type NetworkNameType = NetworkNames;

// The `web3Modal` localStorage cached provider key
const WEB3_CONNECT_CACHED_PROVIDER: string = 'WEB3_CONNECT_CACHED_PROVIDER';

export enum DefaultTheme {
  DARK = 'dark',
  LIGHT = 'light',
}

enum ActionType {
  ACTIVATE_PROVIDER,
  DEACTIVATE_PROVIDER,
  ERROR_FROM_ACTIVATION,
  ERROR,
  INIT_WEB3MODAL,
  INITIAL_CACHED_CONNECTOR_CHECK_STATUS,
  UPDATE_ACCOUNT,
  UPDATE_FROM_ERROR,
  UPDATE_NEW_CONNECTION,
}

interface Action {
  type: ActionType;
  payload?: any;
}

interface Web3ModalManagerState {
  account?: undefined | string;
  connected?: boolean;
  error?: Error;
  initialCachedConnectorCheckStatus?: AsyncStatus;
  networkId?: number;
  provider?: any;
  web3Instance?: Web3;
  web3Modal?: Web3Modal;
}

function reducer(
  state: Web3ModalManagerState,
  {type, payload}: Action
): Web3ModalManagerState {
  switch (type) {
    case ActionType.INITIAL_CACHED_CONNECTOR_CHECK_STATUS: {
      return {
        ...state,
        initialCachedConnectorCheckStatus: payload,
      };
    }

    case ActionType.INIT_WEB3MODAL: {
      const {web3Modal} = payload;
      return {web3Modal};
    }

    case ActionType.ACTIVATE_PROVIDER: {
      const {provider, networkId, account, web3Modal} = payload;
      return {provider, networkId, account, web3Modal};
    }

    case ActionType.UPDATE_ACCOUNT: {
      const {account} = payload;

      return {
        ...state,
        account,
      };
    }

    case ActionType.UPDATE_FROM_ERROR: {
      const {provider, networkId, account} = payload;
      return {
        ...state,
        account,
        error: undefined,
        networkId,
        provider,
      };
    }

    case ActionType.UPDATE_NEW_CONNECTION: {
      const {provider, networkId, account, connected, web3Instance} = payload;

      return {
        ...state,
        account,
        connected,
        networkId,
        provider,
        web3Instance,
      };
    }

    case ActionType.ERROR: {
      const {error} = payload;
      const {provider} = state;
      return {
        provider,
        error,
      };
    }

    case ActionType.ERROR_FROM_ACTIVATION: {
      const {provider, error} = payload;
      return {
        provider,
        error,
      };
    }

    case ActionType.DEACTIVATE_PROVIDER: {
      return {};
    }
  }
}

interface Web3ModalManagerInterface {
  defaultChain?: number;
  defaultTheme?: DefaultTheme;
  onAfterDisconnect?: () => void;
  onBeforeConnect?: (state: Web3ModalManagerState) => void;
  providerOptions: Record<string, any>;
}

export default function useWeb3ModalManager({
  defaultChain,
  defaultTheme,
  onAfterDisconnect,
  onBeforeConnect,
  providerOptions,
}: Web3ModalManagerInterface) {
  /**
   * Reducers
   */

  const [state, dispatch] = useReducer<typeof reducer>(reducer, {
    initialCachedConnectorCheckStatus: AsyncStatus.STANDBY,
  });

  /**
   * Variables
   */

  const web3ModalTheme = defaultTheme;
  const web3ModalChain: number = defaultChain || DEFAULT_CHAIN;

  /**
   * Cached callbacks
   */

  const onConnectToCached = useCallback(onConnectTo, [
    onBeforeConnect,
    state.error,
    state.initialCachedConnectorCheckStatus,
    state.web3Modal,
  ]);

  const chainChangedCallbackCached = useCallback(chainChangedCallback, [
    onConnectToCached,
    state.web3Modal?.cachedProvider,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    const provider = state.provider;

    // Subscribe to accounts change
    provider?.on('accountsChanged', accountsChangedCallback);

    // Subscribe to chainId change
    provider?.on('chainChanged', chainChangedCallbackCached);

    return () => {
      // Remove listeners on unmount
      provider?.removeListener('accountsChanged', accountsChangedCallback);
      provider?.removeListener('chainChanged', chainChangedCallbackCached);
    };
  }, [chainChangedCallbackCached, state.provider]);

  // Init Web3Modal
  useEffect(() => {
    if (state.web3Modal) return;

    dispatch({
      type: ActionType.INIT_WEB3MODAL,
      payload: {
        web3Modal: new Web3Modal({
          cacheProvider: true, // optional
          network: getNetworkName(web3ModalChain), // optional
          providerOptions, // required
          theme: web3ModalTheme, // optional; `light` or `dark`. `dark` is default
        }),
      },
    });
  }, [providerOptions, state.web3Modal, web3ModalChain, web3ModalTheme]);

  // Attempt to initialise connection to a cached provider
  useEffect(() => {
    if (
      state.initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED ||
      state.initialCachedConnectorCheckStatus === AsyncStatus.PENDING
    ) {
      return;
    }

    attemptUpdateFromCachedConnector(
      state.web3Modal?.cachedProvider,
      onConnectToCached
    );
  }, [
    onConnectToCached,
    state.initialCachedConnectorCheckStatus,
    state.web3Modal?.cachedProvider,
  ]);

  /**
   * Functions
   */

  function accountsChangedCallback([account]: string[]) {
    dispatch({
      type: ActionType.UPDATE_ACCOUNT,
      payload: {
        account,
      },
    });
  }

  function chainChangedCallback(_chainIdHex: string) {
    if (!state.web3Modal?.cachedProvider) return;

    onConnectToCached(state.web3Modal?.cachedProvider);
  }

  /**
   * attemptUpdateFromCachedConnector
   *
   * Will attempt to connect if a `connectorId` (e.g. `"injected"`)
   * and cached provider (via `localStorage`) is available.
   *
   * @param connectorId `String | undefined`
   * @param action `Function` callback which dispatches an action to connect
   * @returns void
   */
  async function attemptUpdateFromCachedConnector(
    connectorId: string | undefined,
    action: (cid: string) => Promise<void>
  ): Promise<void> {
    const statusAction = ActionType.INITIAL_CACHED_CONNECTOR_CHECK_STATUS;

    try {
      /**
       * Wait for the `state.web3Modal` object to be available, as `cachedProvider`
       * defaults to an empty `String` if not set.
       */
      if (typeof connectorId !== 'string') return;

      dispatch({
        type: statusAction,
        payload: AsyncStatus.PENDING,
      });

      if (connectorId && localStorage.getItem(WEB3_CONNECT_CACHED_PROVIDER)) {
        await action(connectorId);
      }

      dispatch({
        type: statusAction,
        payload: AsyncStatus.FULFILLED,
      });
    } catch (error) {
      dispatch({
        type: statusAction,
        payload: AsyncStatus.REJECTED,
      });

      console.log(error);
    }
  }

  /**
   * Connect to a specfic wallet; get account assets and
   * subscribe to provider events
   */
  async function onConnectTo(connectorId: string) {
    try {
      if (!state.web3Modal) return;

      const provider = await state.web3Modal.connectTo(connectorId);

      const web3: Web3 = new Web3(provider);

      // get accounts
      const accounts = await web3.eth.getAccounts();
      // get connected network id
      const networkId = await web3.eth.net.getId();

      // Run callback if provided
      onBeforeConnect?.({
        account: accounts[0],
        connected: true,
        error: state.error,
        initialCachedConnectorCheckStatus:
          state.initialCachedConnectorCheckStatus,
        networkId,
        provider,
        web3Instance: web3,
        web3Modal: state.web3Modal,
      });

      dispatch({
        type: ActionType.UPDATE_NEW_CONNECTION,
        payload: {
          account: accounts[0],
          connected: true,
          networkId,
          provider,
          web3Instance: web3,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Disconnect wallet button pressed.
   */
  async function onDisconnect() {
    try {
      if (state.provider.close) {
        await state.provider.close();
      }

      // If the cached provider is not cleared,
      // WalletConnect will default to the existing session
      // and does not allow to re-scan the QR code with a new wallet.
      // Depending on your use case you may want or want not his behaviour.
      state.web3Modal && (await state.web3Modal.clearCachedProvider());

      // Reset all states; except for web3Modal?!
      dispatch({type: ActionType.DEACTIVATE_PROVIDER});

      // Run callback if provided
      onAfterDisconnect?.();
    } catch (error) {
      console.error(error);
    }
  }

  function getNetworkName(web3ModalChain: number): NetworkNameType {
    switch (web3ModalChain) {
      case NetworkIDs.GOERLI:
        return NetworkNames.GOERLI;
      case NetworkIDs.KOVAN:
        return NetworkNames.KOVAN;
      case NetworkIDs.RINKEBY:
        return NetworkNames.RINKEBY;
      case NetworkIDs.ROPSTEN:
        return NetworkNames.ROPSTEN;
      case NetworkIDs.MAINNET:
        return NetworkNames.MAINNET;
      default:
        return NetworkNames.MAINNET;
    }
  }

  return {
    ...state,
    onConnectTo,
    onDisconnect,
    providerOptions,
  };
}
