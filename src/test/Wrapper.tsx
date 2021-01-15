import {Store} from 'redux';
import {MemoryRouter} from 'react-router-dom';
import {provider as Web3Provider} from 'web3-core/types';
import {Provider} from 'react-redux';
import React, {useEffect, useMemo, useState} from 'react';
import Web3 from 'web3';

import {
  Web3ModalContext,
  Web3ModalContextValue,
} from '../components/web3/Web3ModalManager';
import * as useWeb3ModalToMock from '../components/web3/hooks/useWeb3Modal';
import * as getAdapterAddressToMock from '../components/web3/helpers/getAdapterAddress';
import {CHAINS as mockChains} from '../config';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider, getNewStore} from './helpers';
import Init, {InitError} from '../Init';

export type WrapperReturnProps = {
  mockWeb3Provider: FakeHttpProvider;
  store: Store;
  web3Instance: Web3;
};

type WrapperProps = {
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
  /**
   * Option to Mock provider.request from MetaMask
   */
  mockMetaMaskRequest?: boolean;
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
    useInit = false,
    useWallet = false,
    web3ModalContext,
    mockMetaMaskRequest = false,
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
        networkId: mockChains['GANACHE'],
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
    // @note For signing ERC712 with MetaMask's API provider.request
    mockMetaMaskRequest &&
      ((mockWeb3Provider as any).request = async () =>
        web3Instance.eth.abi.encodeParameter('uint256', 123));

    return () => {
      mockMetaMaskRequest && delete (mockWeb3Provider as any).request;
    };
  }, [mockMetaMaskRequest, mockWeb3Provider, web3Instance.eth.abi]);

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

  return (
    <Provider store={store}>
      <Web3ModalContext.Provider
        value={web3ModalContext || ({} as Web3ModalContextValue)}>
        <MemoryRouter>{renderChildren(props.children)}</MemoryRouter>
      </Web3ModalContext.Provider>
    </Provider>
  );
}
