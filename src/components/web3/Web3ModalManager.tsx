import {createContext, useEffect, useRef, useState} from 'react';
import Web3 from 'web3';
import Web3Modal, {IProviderOptions} from 'web3modal';

import useWeb3ModalManager, {
  DefaultTheme,
  Web3ModalError,
} from './hooks/useWeb3ModalManager';
import {AsyncStatus} from '../../util/types';
import {ETHEREUM_PROVIDER_URL} from '../../config';

type Web3ModalProviderArguments = {
  defaultChain?: number;
  defaultTheme?: DefaultTheme;
  /**
   * Optional: Any action to take after disconnecting from an Ethereum provider.
   */
  onBeforeDisconnect?: Parameters<
    typeof useWeb3ModalManager
  >[0]['onBeforeDisconnect'];
  /**
   * Optional: Any action to take before connecting to an Ethereum provider.
   */
  onBeforeConnect?: Parameters<
    typeof useWeb3ModalManager
  >[0]['onBeforeConnect'];
  providerOptions: IProviderOptions; // required
};

type Web3ModalManagerProps = {
  children: JSX.Element;
} & Web3ModalProviderArguments;

export type Web3ModalContextValue = {
  account: string | undefined;
  connected: boolean | undefined;
  connectWeb3Modal: (providerName: string) => void;
  disconnectWeb3Modal: () => void;
  error: Web3ModalError | undefined;
  initialCachedConnectorCheckStatus: AsyncStatus | undefined;
  networkId: number | undefined;
  provider: any;
  providerOptions: IProviderOptions;
  web3Instance: Web3 | undefined;
  web3Modal: Web3Modal | undefined;
};

export const Web3ModalContext = createContext<Web3ModalContextValue>(
  {} as Web3ModalContextValue
);

/**
 * Web3ModalManager
 *
 * A provider for the `web3modal` wallet connection, provides access to
 * the wallet states, enables connections and disconnections.
 *
 * @example
 * <Web3ModalManager defaultChain={1} defaultTheme={'dark'} providerOptions={...}>
 *   ...
 * </Web3ModalManager>
 *
 * @param children: React.JSX
 * @param defaultChain?: number
 * @param defaultTheme?: DefaultTheme; default is `dark`
 * @param providerOptions: Record<string, any>
 */

export default function Web3ModalManager({
  children,
  defaultChain,
  defaultTheme = DefaultTheme.DARK,
  onBeforeConnect,
  onBeforeDisconnect,
  providerOptions,
}: Web3ModalManagerProps) {
  /**
   * Refs
   */

  const defaultWeb3InstanceRef = useRef<Web3 | undefined>(
    new Web3(new Web3.providers.WebsocketProvider(ETHEREUM_PROVIDER_URL))
  );

  /**
   * State
   */

  const [defaultWeb3NetID, setDefaultWeb3NetID] = useState<
    number | undefined
  >();

  /**
   * Variables
   */

  const web3ModalProviderArguments: Web3ModalProviderArguments = {
    defaultChain,
    defaultTheme,
    onBeforeConnect,
    onBeforeDisconnect,
    providerOptions,
  };

  /**
   * Our hooks
   */

  const {
    account,
    connected,
    connectWeb3Modal,
    disconnectWeb3Modal,
    error,
    initialCachedConnectorCheckStatus,
    networkId = defaultWeb3NetID,
    provider = defaultWeb3InstanceRef.current?.currentProvider,
    web3Instance = defaultWeb3InstanceRef.current,
    web3Modal,
  } = useWeb3ModalManager(web3ModalProviderArguments);

  /**
   * Effects
   */

  // Set network ID when using `defaultWeb3InstanceRef` (i.e. not connected to a wallet)
  useEffect(() => {
    if (
      !connected &&
      initialCachedConnectorCheckStatus === AsyncStatus.FULFILLED
    ) {
      defaultWeb3InstanceRef.current?.eth.net
        .getId()
        .then(setDefaultWeb3NetID)
        .catch(() => setDefaultWeb3NetID(undefined));
    }
  }, [connected, initialCachedConnectorCheckStatus]);

  /**
   * Render
   */

  const web3ModalContext: Web3ModalContextValue = {
    account,
    connected,
    connectWeb3Modal,
    disconnectWeb3Modal,
    error,
    initialCachedConnectorCheckStatus,
    networkId,
    provider,
    providerOptions,
    web3Instance,
    web3Modal,
  };

  return (
    <Web3ModalContext.Provider value={web3ModalContext}>
      {children}
    </Web3ModalContext.Provider>
  );
}
