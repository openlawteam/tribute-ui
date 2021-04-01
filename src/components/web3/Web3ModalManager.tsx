import {createContext, useEffect, useRef, useState} from 'react';
import Web3 from 'web3';

import {INFURA_API_URL} from '../../config';
import useWeb3ModalManager, {DefaultTheme} from './hooks/useWeb3ModalManager';

type Web3ModalProviderArguments = {
  defaultChain?: number;
  defaultTheme?: DefaultTheme;
  providerOptions: Record<string, any>; // required
};

type Web3ModalManagerProps = {
  children: JSX.Element;
} & Web3ModalProviderArguments;

export type Web3ModalContextValue = {
  account: string | undefined;
  connected: boolean | undefined;
  networkId: number | undefined;
  onConnectTo: (providerName: string) => void;
  onDisconnect: () => void;
  provider: any;
  providerOptions: Record<string, any>;
  web3Instance: Web3;
  web3Modal: any;
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
  providerOptions,
}: Web3ModalManagerProps) {
  /**
   * Refs
   */

  // @todo Option to use `ganache.provider()`, as well?
  const defaultWeb3InstanceRef = useRef<Web3>(
    new Web3(new Web3.providers.WebsocketProvider(INFURA_API_URL))
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
    providerOptions,
  };

  /**
   * Our hooks
   */

  const {
    account,
    connected,
    onConnectTo,
    onDisconnect,
    networkId = defaultWeb3NetID,
    provider = defaultWeb3InstanceRef.current.currentProvider,
    web3Instance = defaultWeb3InstanceRef.current,
    web3Modal,
  } = useWeb3ModalManager(web3ModalProviderArguments);

  /**
   * Effects
   */

  // Set network ID when using `defaultWeb3InstanceRef` (i.e. not connected to a wallet)
  useEffect(() => {
    if (!connected) {
      defaultWeb3InstanceRef.current.eth.net
        .getId()
        .then(setDefaultWeb3NetID)
        .catch(() => setDefaultWeb3NetID(undefined));
    }
  }, [connected]);

  /**
   * Render
   */

  const web3ModalContext = {
    account,
    connected,
    onConnectTo,
    onDisconnect,
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
