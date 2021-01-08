import {applyMiddleware, createStore, Store} from 'redux';
import {composeWithDevTools} from 'redux-devtools-extension/logOnlyInProduction';
import {MemoryRouter} from 'react-router-dom';
import {provider as Web3Provider} from 'web3-core/types';
import {Provider} from 'react-redux';

import React, {useCallback, useEffect, useState} from 'react';
import thunk from 'redux-thunk';
import Web3 from 'web3';

import {setConnectedAddress, walletAuthenticated} from '../store/actions';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from './helpers';
import {ReduxDispatch} from '../util/types';
import Init, {InitError} from '../Init';
import rootReducer from '../store/reducers';
import {
  Web3ModalContext,
  Web3ModalContextValue,
} from '../components/web3/Web3ModalManager';

type WrapperReturnProps = {
  mockWeb3Provider: FakeHttpProvider;
  store: Store;
  web3Instance: Web3;
};

type WrapperProps = {
  /**
   * A callback which will run once the wallet is initiated.
   * i.e. Good for timing conflict issues with <Init /> on wallet setup.
   */
  onUseWallet?: (dispatch: ReduxDispatch) => void;
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

const getNewStore = () =>
  createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));

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
    onUseWallet,
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
   * Variables
   */

  const dispatch = store.dispatch as ReduxDispatch;

  /**
   * Cached callbacks
   */

  const setupWalletCached = useCallback(setupWallet, [
    dispatch,
    onUseWallet,
    useWallet,
  ]);

  /**
   * Effects
   */

  // Set up Web3-related Redux state
  useEffect(() => {
    setupWalletCached();
  }, [setupWalletCached]);

  /**
   * Functions
   */

  function setupWallet() {
    if (useWallet) {
      // Set Redux store state
      dispatch(walletAuthenticated(true));
      dispatch(setConnectedAddress(DEFAULT_ETH_ADDRESS));

      onUseWallet && onUseWallet(dispatch);
    }
  }

  /**
   * An optional Web3 provider for mocking. We pass it in so a test
   * can use the original provider (i.e. if using FakeHttpProvider).
   * @todo
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
            <>
              {/* @note Needs to run after Init b/c of useInitContracts */}
              {setupWalletCached()}

              {childrenToRender}
            </>
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
