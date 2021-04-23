import {Store} from 'redux';
import {MemoryRouter} from 'react-router-dom';
import {provider as Web3Provider} from 'web3-core/types';
import {Provider} from 'react-redux';
import React, {useEffect, useMemo, useState} from 'react';
import Web3 from 'web3';

import * as useWeb3ModalToMock from '../components/web3/hooks/useWeb3Modal';
import * as getAdapterAddressToMock from '../components/web3/helpers/getAdapterAddress';
import * as getExtensionAddressToMock from '../components/web3/helpers/getExtensionAddress';
import {
  Web3ModalContext,
  Web3ModalContextValue,
} from '../components/web3/Web3ModalManager';
import {
  balanceOfMember,
  getCurrentDelegateKey,
  memberAddressesByDelegatedKey,
} from './web3Responses';
import {CHAINS as mockChains} from '../config';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider, getNewStore} from './helpers';
import Init, {InitError} from '../Init';
import IVotingABI from '../truffle-contracts/IVoting.json';

export type WrapperReturnProps = {
  mockWeb3Provider: FakeHttpProvider;
  store: Store;
  web3Instance: Web3;
};

type WrapperProps = {
  /**
   * Getter for the internal props. Useful when you do not want to use the render prop arguments.
   */
  getProps?: (p: WrapperReturnProps) => void;
  /**
   * Use the `<Init />` component to wrap the child component.
   */
  useInit?: boolean;
  /**
   * Fake authentication into a browser wallet.
   */
  useWallet?: boolean;
  /**
   * An optional render prop for consumers to receive internal state.
   */
  render?: (p: WrapperReturnProps) => React.ReactNode;
  /**
   * Web3 modal manager context options
   */
  web3ModalContext?: Web3ModalContextValue;
};

/**
 * Similar to our app code, `<Wrapper />` provides a wrapper for tests which need the following to run:
 *
 *  - Redux store
 *  - React-Router
 *  - Web3
 */
export default function Wrapper(
  props: WrapperProps & React.PropsWithChildren<React.ReactNode>
) {
  const {
    getProps,
    useInit = false,
    useWallet = false,
    web3ModalContext,
  } = props;

  /**
   * State
   */

  const [store] = useState<Store>(getNewStore());
  const [mockWeb3Provider] = useState<FakeHttpProvider>(new FakeHttpProvider());
  const [web3Instance] = useState<Web3>(
    new Web3((mockWeb3Provider as unknown) as Web3Provider)
  );

  /**
   * Cached values
   */

  // @note We rename `web3->mockWeb3` due to Jest rule in `mockImplementation`.
  const mockWeb3 = web3Instance;

  // If `useWallet` is enabled it will mock the `useWeb3Modal` response so we can test tx's.
  const useWeb3ModalMock = useMemo(() => {
    if (!useWallet) return;

    return jest
      .spyOn(useWeb3ModalToMock, 'useWeb3Modal')
      .mockImplementation(() => ({
        account: DEFAULT_ETH_ADDRESS,
        connected: true,
        providerOptions: {},
        onConnectTo: () => {},
        onDisconnect: () => {},
        networkId: mockChains.GANACHE,
        provider: mockWeb3Provider,
        web3Instance: mockWeb3,
        web3Modal: null,
      }));
  }, [mockWeb3, mockWeb3Provider, useWallet]);

  // If `useWallet` is enabled it will mock the `getAdapterAddress` response so we can init contracts.
  const getAdapterAddressMock = useMemo(() => {
    if (!useWallet) return;

    return jest
      .spyOn(getAdapterAddressToMock, 'getAdapterAddress')
      .mockImplementation(() => Promise.resolve(DEFAULT_ETH_ADDRESS));
  }, [useWallet]);

  const getExtensionAddressMock = useMemo(() => {
    if (!useWallet) return;

    return jest
      .spyOn(getExtensionAddressToMock, 'getExtensionAddress')
      .mockImplementation(() => Promise.resolve(DEFAULT_ETH_ADDRESS));
  }, [useWallet]);

  /**
   * Effects
   */

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      useWeb3ModalMock?.mockRestore();
    };
  }, [useWeb3ModalMock]);

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      getAdapterAddressMock?.mockRestore();
    };
  }, [getAdapterAddressMock]);

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      getExtensionAddressMock?.mockRestore();
    };
  }, [getExtensionAddressMock]);

  useEffect(() => {}, [
    mockWeb3Provider,
    useInit,
    web3Instance.eth.abi,
    web3Instance.utils,
  ]);

  useEffect(() => {
    /**
     * Mock rpc response for voting contract name inside init
     * @note This should come first
     */
    if (useInit) {
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter(
          'string',
          'OffchainVotingContract'
        ),
        {abi: IVotingABI, abiMethodName: 'getAdapterName'}
      );
    }

    if (useWallet) {
      mockWeb3Provider.injectResult(
        ...memberAddressesByDelegatedKey({web3Instance})
      );
      // Defaults to `100`
      mockWeb3Provider.injectResult(...balanceOfMember({web3Instance}));
      mockWeb3Provider.injectResult(...getCurrentDelegateKey({web3Instance}));
    }
  }, [mockWeb3Provider, useInit, useWallet, web3Instance]);

  /**
   * Functions
   */

  function getRenderReturnProps(): WrapperReturnProps {
    return {
      mockWeb3Provider,
      store,
      web3Instance,
    };
  }

  function renderChildren(children: React.ReactNode) {
    // Call user callback, if provided.
    getProps && getProps(getRenderReturnProps());

    const childrenToRender = props.render
      ? props.render(getRenderReturnProps())
      : children;

    return useInit ? (
      <Init
        render={({error}) =>
          !error ? (
            <>{childrenToRender}</>
          ) : error ? (
            <InitError error={error} />
          ) : null
        }
      />
    ) : (
      childrenToRender
    );
  }

  /**
   * Other mocks
   */

  return (
    <Provider store={store}>
      <Web3ModalContext.Provider
        value={web3ModalContext || ({} as Web3ModalContextValue)}>
        <MemoryRouter>{renderChildren(props.children)}</MemoryRouter>
      </Web3ModalContext.Provider>
    </Provider>
  );
}
