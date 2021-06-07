import {useReducer, useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import Web3 from 'web3';
import Web3Modal from 'web3modal';

import {DEFAULT_CHAIN} from '../../../config';
import {clearConnectedMember} from '../../../store/actions';
import {NetworkNames, NetworkIDs} from '../../../util/enums';
import {AsyncStatus} from '../../../util/types';

type NetworkNameType = NetworkNames;

// The `web3Modal` localStorage cached provider key
const WEB3_CONNECT_CACHED_PROVIDER: string = 'WEB3_CONNECT_CACHED_PROVIDER';

export enum DefaultTheme {
  DARK = 'dark',
  LIGHT = 'light',
}

enum ActionType {
  INITIAL_CACHED_CONNECTOR_CHECK_STATUS,
  INIT_WEB3MODAL,
  ACTIVATE_PROVIDER,
  UPDATE,
  UPDATE_FROM_ERROR,
  ERROR,
  ERROR_FROM_ACTIVATION,
  DEACTIVATE_PROVIDER,
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

    case ActionType.UPDATE: {
      const {provider, networkId, account, connected, web3Instance} = payload;

      return {
        ...state,
        ...(provider === undefined ? null : {provider}),
        ...(networkId === undefined ? null : {networkId}),
        ...(account === undefined ? null : {account}),
        ...(connected === undefined ? null : {connected}),
        ...(web3Instance === undefined ? null : {web3Instance}),
      };
    }

    case ActionType.UPDATE_FROM_ERROR: {
      const {provider, networkId, account} = payload;
      return {
        ...state,
        ...(provider === undefined ? null : {provider}),
        ...(networkId === undefined ? null : {networkId}),
        ...(account === undefined ? null : {account}),
        error: undefined,
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
  providerOptions: Record<string, any>; //required
}

export default function useWeb3ModalManager({
  defaultChain,
  defaultTheme,
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
  const web3ModalChain = defaultChain || DEFAULT_CHAIN;

  /**
   * @note Disable hook lint checks for now as some additional deps cause render issues.
   */
  //eslint-disable-next-line react-hooks/exhaustive-deps
  const onConnectToCached = useCallback(onConnectTo, [state.web3Modal]);
  const getNetworkNameCached = useCallback(getNetworkName, [web3ModalChain]);

  /**
   * Their hooks
   */

  const storeDispatch = useDispatch();

  /**
   * Init Web3Modal
   */
  useEffect(() => {
    if (!state.web3Modal) {
      dispatch({
        type: ActionType.INIT_WEB3MODAL,
        payload: {
          web3Modal: new Web3Modal({
            cacheProvider: true, // optional
            network: getNetworkNameCached(), // optional
            providerOptions, // required
            theme: web3ModalTheme, // optional; `light` or `dark`. `dark` is default
          }),
        },
      });
    }
  }, [getNetworkNameCached, providerOptions, web3ModalTheme, state.web3Modal]);

  /**
   * Attempt to initialise connection to a cached provider
   */
  useEffect(() => {
    attemptUpdateFromCachedConnector(
      state.web3Modal?.cachedProvider,
      onConnectToCached
    );
  }, [onConnectToCached, state.web3Modal?.cachedProvider]);

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

      subscribeProvider(provider);

      const web3: Web3 = new Web3(provider);

      // get accounts
      const accounts = await web3.eth.getAccounts();
      // get connected network id
      const networkId = await web3.eth.net.getId();

      dispatch({
        type: ActionType.UPDATE,
        payload: {
          account: accounts[0],
          connected: true,
          provider,
          networkId,
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
      storeDispatch(clearConnectedMember());
    } catch (error) {
      console.error(error);
    }
  }

  function subscribeProvider(provider: any) {
    if (!provider?.on) return;

    // Subscribe to accounts change
    provider.on('accountsChanged', (accounts: string[]) => {
      dispatch({
        type: ActionType.UPDATE,
        payload: {
          account: accounts[0],
        },
      });
    });

    // Subscribe to chainId change
    provider.on('chainChanged', (chainId: string) => {
      async function handleChainChanged(cachedProvider: string) {
        // convert `chainId` hex string to number
        const networkId = parseInt(chainId, 16);

        dispatch({
          type: ActionType.UPDATE,
          payload: {
            networkId,
          },
        });

        // if we are connected to the correct network; connect to provider
        Number(networkId) === Number(chainId) &&
          (await onConnectToCached(cachedProvider));
      }

      if (state.web3Modal?.cachedProvider) {
        handleChainChanged(state.web3Modal?.cachedProvider);
      }
    });

    // Subscribe to provider connection
    provider.on('connect', (info: {chainId: number}) => {
      console.info('connect', info);
    });

    // Subscribe to provider disconnection
    provider.on('disconnect', (error: {code: number; message: string}) => {
      console.info('disconnect', error);
    });
  }

  function getNetworkName(): NetworkNameType {
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
