import React, {createContext} from 'react';
import Web3 from 'web3';

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
  providerOptions: Record<string, any>;
  onConnectTo: (providerName: string) => void;
  onDisconnect: () => void;
  networkId: number | undefined;
  provider: any;
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
  const web3ModalProviderArguments: Web3ModalProviderArguments = {
    defaultChain,
    defaultTheme,
    providerOptions,
  };
  const {
    account,
    connected,
    onConnectTo,
    onDisconnect,
    networkId,
    provider,
    web3Instance,
    web3Modal,
  } = useWeb3ModalManager(web3ModalProviderArguments);

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
