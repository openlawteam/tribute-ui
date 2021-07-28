import {Store} from 'redux';
import {MemoryRouter} from 'react-router-dom';
import type {LocationDescriptor} from 'history';
import {provider as Web3Provider} from 'web3-core/types';
import {Provider} from 'react-redux';
import {ApolloProvider} from '@apollo/react-hooks';
import React, {useEffect, useMemo, useState} from 'react';
import Web3 from 'web3';
import {QueryClientProvider} from 'react-query';

import {
  Web3ModalContext,
  Web3ModalContextValue,
} from '../components/web3/Web3ModalManager';
import {AsyncStatus} from '../util/types';
import {CHAINS as mockChains, WALLETCONNECT_PROVIDER_OPTIONS} from '../config';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider, getNewStore} from './helpers';
import {getApolloClient, queryClient} from '../index';
import {VotingAdapterName} from '../components/adapters-extensions/enums';
import App from '../App';
import Init from '../Init';
import InitError from '../InitError';

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
   * Web3 modal manager context values
   */
  web3ModalContext?: Partial<Web3ModalContextValue>;
  /**
   * Initial entries for location path and search queries
   */
  locationEntries?: LocationDescriptor[];
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
    locationEntries,
  } = props;

  /**
   * State
   */

  const [store] = useState<Store>(getNewStore());
  const [mockWeb3Provider] = useState<FakeHttpProvider>(new FakeHttpProvider());
  const [web3Instance] = useState<Web3>(
    new Web3(mockWeb3Provider as unknown as Web3Provider)
  );

  /**
   * Cached values
   */

  const web3ContextValues = useMemo(
    () =>
      useWallet
        ? {
            account: DEFAULT_ETH_ADDRESS,
            connected: true,
            error: undefined,
            initialCachedConnectorCheckStatus: AsyncStatus.FULFILLED,
            providerOptions: WALLETCONNECT_PROVIDER_OPTIONS,
            connectWeb3Modal: () => {},
            disconnectWeb3Modal: () => {},
            networkId: mockChains.GANACHE,
            provider: mockWeb3Provider,
            web3Instance,
            web3Modal: null as any,

            // Spread-in props
            ...web3ModalContext,
          }
        : {},
    [mockWeb3Provider, useWallet, web3Instance, web3ModalContext]
  );

  // If `useWallet` is enabled it will mock the `getAdapterAddress` response so we can init contracts.
  const getAdapterAddressMock = useMemo(async () => {
    if (!useWallet) return;

    const getAdapterAddressToMock = await import(
      '../components/web3/helpers/getAdapterAddress'
    );

    return jest
      .spyOn(getAdapterAddressToMock, 'getAdapterAddress')
      .mockImplementation(() => Promise.resolve(DEFAULT_ETH_ADDRESS));
  }, [useWallet]);

  const getExtensionAddressMock = useMemo(async () => {
    if (!useWallet) return;

    const getExtensionAddressToMock = await import(
      '../components/web3/helpers/getExtensionAddress'
    );

    return jest
      .spyOn(getExtensionAddressToMock, 'getExtensionAddress')
      .mockImplementation(() => Promise.resolve(DEFAULT_ETH_ADDRESS));
  }, [useWallet]);

  /**
   * Mock RPC response for voting contract name:
   *
   * @see `<Init />`
   * @see `initRegisteredVotingAdapter`
   */
  const getVotingAdapterNameMock = useMemo(async () => {
    if (!useWallet) return;

    const getVotingAdapterNameToMock = await import(
      '../components/web3/helpers/getVotingAdapterName'
    );

    return jest
      .spyOn(getVotingAdapterNameToMock, 'getVotingAdapterName')
      .mockImplementation(() =>
        Promise.resolve(VotingAdapterName.OffchainVotingContract)
      );
  }, [useWallet]);

  /**
   * Effects
   */

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      getAdapterAddressMock.then((v) => v?.mockRestore());
    };
  }, [getAdapterAddressMock]);

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      getExtensionAddressMock.then((v) => v?.mockRestore());
    };
  }, [getExtensionAddressMock]);

  useEffect(() => {
    return () => {
      // When `<Wrapper />` unmounts, restore the original function.
      getVotingAdapterNameMock.then((v) => v?.mockRestore());
    };
  }, [getVotingAdapterNameMock]);

  useEffect(() => {
    /**
     * Setup for `getConnectedMember` in `<Init />`
     * @note This should come first
     */
    if (useWallet) {
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `getAddressIfDelegated` call
              web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              ),
              // For `members` call
              web3Instance.eth.abi.encodeParameter('uint8', '1'),
              // For `isActiveMember` call
              web3Instance.eth.abi.encodeParameter('bool', true),
              // For `getCurrentDelegateKey` call
              web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              ),
            ],
          ]
        ),
        {debugName: '<Wrapper /> multicall for `getConnectedMember`'}
      );
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
            <App renderMainContent={() => <InitError error={error} />} />
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
        value={web3ContextValues as Web3ModalContextValue}>
        <MemoryRouter initialEntries={locationEntries || [{pathname: '/'}]}>
          <ApolloProvider client={getApolloClient(store)}>
            <QueryClientProvider client={queryClient}>
              {renderChildren(props.children)}
            </QueryClientProvider>
          </ApolloProvider>
        </MemoryRouter>
      </Web3ModalContext.Provider>
    </Provider>
  );
}
