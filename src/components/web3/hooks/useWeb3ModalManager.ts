import {useReducer, useCallback, useEffect} from 'react';
import Web3 from 'web3';
import Web3Modal, {IProviderOptions} from 'web3modal';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_CHAIN} from '../../../config';
import {NetworkNames, NetworkIDs} from '../../../util/enums';

export enum DefaultTheme {
  DARK = 'dark',
  LIGHT = 'light',
}

enum ActionType {
  CONNECT_WEB3MODAL,
  DEACTIVATE_PROVIDER_WEB3MODAL,
  ERROR_WEB3MODAL,
  INITIAL_CACHED_CONNECTOR_CHECK_STATUS,
  NEW_WEB3MODAL,
  UPDATE_ACCOUNT,
}

interface Action {
  type: ActionType;
  payload?: Partial<Web3ModalManagerState>;
}

export enum Web3ModalErrorType {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
}

export type Web3ModalError = {
  connectorId: string;
  error: Error;
  type: Web3ModalErrorType;
};

type Web3ModalManagerState = {
  account?: undefined | string;
  connected?: boolean;
  error?: Web3ModalError;
  initialCachedConnectorCheckStatus?: AsyncStatus;
  networkId?: number;
  provider?: any;
  web3Instance?: Web3;
  web3Modal?: Web3Modal;
};

interface Web3ModalManagerInterface {
  defaultChain?: number;
  defaultTheme?: DefaultTheme;
  onBeforeDisconnect?: () => void;
  onBeforeConnect?: () => void;
  providerOptions: IProviderOptions;
}

type UseWeb3ModalManagerReturn = {
  connectWeb3Modal: (connectorId: string) => Promise<void>;
  disconnectWeb3Modal: () => Promise<void>;
  providerOptions: Web3ModalManagerInterface['providerOptions'];
} & Web3ModalManagerState;

const INITIAL_STATE = {};

function reducer(
  state: Web3ModalManagerState = INITIAL_STATE,
  {type, payload}: Action
): Web3ModalManagerState {
  switch (type) {
    case ActionType.CONNECT_WEB3MODAL: {
      const {provider, networkId, account, connected, web3Instance} =
        payload || {};

      return {
        ...state,
        account,
        connected,
        networkId,
        provider,
        web3Instance,
      };
    }

    case ActionType.DEACTIVATE_PROVIDER_WEB3MODAL: {
      return INITIAL_STATE;
    }

    case ActionType.ERROR_WEB3MODAL: {
      const {error} = payload || {};

      return {
        ...state,
        error,
      };
    }

    case ActionType.INITIAL_CACHED_CONNECTOR_CHECK_STATUS: {
      const {initialCachedConnectorCheckStatus} = payload || {};

      return {
        ...state,
        initialCachedConnectorCheckStatus,
      };
    }

    case ActionType.NEW_WEB3MODAL: {
      const {web3Modal} = payload || {};
      return {web3Modal};
    }

    case ActionType.UPDATE_ACCOUNT: {
      const {account} = payload || {};

      return {
        ...state,
        account,
      };
    }

    default:
      return INITIAL_STATE;
  }
}

export default function useWeb3ModalManager({
  defaultChain,
  defaultTheme,
  onBeforeConnect,
  onBeforeDisconnect,
  providerOptions,
}: Web3ModalManagerInterface): UseWeb3ModalManagerReturn {
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

  const connectWeb3ModalCached = useCallback(connectWeb3Modal, [
    onBeforeConnect,
    state.web3Modal,
  ]);

  const chainChangedCallbackCached = useCallback(chainChangedCallback, [
    connectWeb3ModalCached,
    state.web3Modal?.cachedProvider,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    const provider = state.provider;

    // Subscribe to accounts change
    provider?.on?.('accountsChanged', accountsChangedCallback);

    // Subscribe to chainId change
    provider?.on?.('chainChanged', chainChangedCallbackCached);

    return () => {
      // Remove listeners on unmount
      provider?.removeListener?.('accountsChanged', accountsChangedCallback);
      provider?.removeListener?.('chainChanged', chainChangedCallbackCached);
    };
  }, [chainChangedCallbackCached, state.provider]);

  // Init Web3Modal
  useEffect(() => {
    if (state.web3Modal) return;

    dispatch({
      type: ActionType.NEW_WEB3MODAL,
      payload: {
        web3Modal: new Web3Modal({
          cacheProvider: true, // optional
          network: NetworkNames[NetworkIDs[web3ModalChain]], // optional
          providerOptions, // required
          theme: web3ModalTheme, // optional; `light` or `dark`. `dark` is default
        }),
      },
    });
  }, [providerOptions, state.web3Modal, web3ModalChain, web3ModalTheme]);

  // Attempt to initialise connection to a cached provider
  useEffect(() => {
    // If the initial check has ran, or is running, exit.
    if (
      state.initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED ||
      state.initialCachedConnectorCheckStatus === AsyncStatus.PENDING
    ) {
      return;
    }

    attemptUpdateFromCachedConnector(
      state.web3Modal?.cachedProvider,
      connectWeb3ModalCached
    );
  }, [
    connectWeb3ModalCached,
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

    connectWeb3ModalCached(state.web3Modal?.cachedProvider);
  }

  /**
   * attemptUpdateFromCachedConnector
   *
   * Will attempt to connect if a `connectorId` (e.g. `"injected"`)
   * and cached provider (via `localStorage`) is available.
   *
   * @param connectorId `String | undefined`
   * @param connectCallback `Function` callback which dispatches an action to connect
   * @returns void
   */
  async function attemptUpdateFromCachedConnector(
    connectorId: string | undefined,
    connectCallback: (cid: string) => Promise<void>
  ): Promise<void> {
    const statusAction = ActionType.INITIAL_CACHED_CONNECTOR_CHECK_STATUS;

    /**
     * Wait for the `state.web3Modal` object to be available, as `cachedProvider`
     * defaults to an empty `String` if not set.
     */
    if (typeof connectorId !== 'string') return;

    dispatch({
      type: statusAction,
      payload: {initialCachedConnectorCheckStatus: AsyncStatus.PENDING},
    });

    if (connectorId) {
      // @note Does not throw
      await connectCallback(connectorId);
    }

    dispatch({
      type: statusAction,
      payload: {initialCachedConnectorCheckStatus: AsyncStatus.FULFILLED},
    });
  }

  /**
   * Connect to a specfic wallet; get account assets and
   * subscribe to provider events
   */
  async function connectWeb3Modal(connectorId: string): Promise<void> {
    try {
      if (!state.web3Modal) return;

      const provider = await state.web3Modal.connectTo(connectorId);

      const web3Instance: Web3 = new Web3(provider);

      // Get index `0` account
      const [account] = await web3Instance.eth.getAccounts();

      // Run callback if provided
      await onBeforeConnect?.();

      dispatch({
        type: ActionType.CONNECT_WEB3MODAL,
        payload: {
          account,
          connected: true,
          networkId: await web3Instance.eth.net.getId(),
          provider,
          web3Instance,
        },
      });
    } catch (error) {
      dispatch({
        type: ActionType.ERROR_WEB3MODAL,
        payload: {
          error: {
            connectorId,
            error: new Error(`Failed to connect to ${connectorId}.`),
            type: Web3ModalErrorType.CONNECT,
          },
        },
      });
    }
  }

  /**
   * Disconnect wallet button pressed.
   */
  async function disconnectWeb3Modal(): Promise<void> {
    try {
      await state.provider?.close?.();

      // If the cached provider is not cleared,
      // WalletConnect will default to the existing session
      // and does not allow to re-scan the QR code with a new wallet.
      // Depending on your use case you may want or want not his behaviour.
      state.web3Modal && (await state.web3Modal.clearCachedProvider());

      // Run callback if provided
      await onBeforeDisconnect?.();

      // Reset all state
      dispatch({type: ActionType.DEACTIVATE_PROVIDER_WEB3MODAL});
    } catch (error) {
      const connectorId: string = state.web3Modal?.cachedProvider || '';

      dispatch({
        type: ActionType.ERROR_WEB3MODAL,
        payload: {
          error: {
            connectorId,
            error: new Error(
              `Failed to disconnect from ${connectorId || 'provider'}.`
            ),
            type: Web3ModalErrorType.DISCONNECT,
          },
        },
      });
    }
  }

  return {
    ...state,
    connectWeb3Modal,
    disconnectWeb3Modal,
    providerOptions,
  };
}
