import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {
  initWeb3Instance,
  setConnectedAddress,
  walletAuthenticated,
} from './store/actions';
import {ReduxDispatch} from './util/types';
import {useInitContracts} from './components/web3/hooks';
import {useWeb3Modal} from './components/web3/Web3ModalManager';
import ErrorMessageWithDetails from './components/common/ErrorMessageWithDetails';
import FadeIn from './components/common/FadeIn';
import Header from './components/Header';
import Wrap from './components/common/Wrap';

type InitPropsRenderProps = {
  error: Error | undefined;
};

type InitProps = {
  render: (p: InitPropsRenderProps) => React.ReactElement | null;
};

type InitErrorProps = {
  error: Error;
};

/**
 * Init Component
 *
 * Init will run any designated sync/async
 * setup processes and then render any child component
 * upon completion.
 *
 * In our case the children prop component to render is our app.
 *
 * @param {InitProps} props
 */
export default function Init(props: InitProps) {
  const {render} = props;

  /**
   * State
   */

  const [error, setError] = useState<Error>();

  /**
   * External Hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();
  const {initContracts} = useInitContracts();
  const {account, connected, provider, web3Instance} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const handleInitContractsCached = useCallback(handleInitContracts, [
    initContracts,
  ]);

  /**
   * Effects
   */

  // Set web3 instance
  useEffect(() => {
    web3Instance && dispatch(initWeb3Instance(web3Instance));
  }, [dispatch, web3Instance]);

  // Set wallet auth
  useEffect(() => {
    dispatch(walletAuthenticated(connected === true));
  }, [connected, dispatch]);

  // Set the address of the connected user
  useEffect(() => {
    dispatch(setConnectedAddress(account?.toLowerCase() ?? ''));
  }, [account, dispatch]);

  // Init the contracts used in the dApp
  useEffect(() => {
    connected && provider && web3Instance && handleInitContractsCached();
  }, [connected, handleInitContractsCached, provider, web3Instance]);

  /**
   * Functions
   */

  async function handleInitContracts() {
    try {
      await initContracts();

      setError(undefined);
    } catch (error) {
      setError(error);
    }
  }

  // Render children
  return render({error});
}

/**
 * InitError
 *
 * An error component that is meant to be used if the <Init /> component
 * could not complete any of its processes to provide the app with vital data.
 *
 * @param {InitErrorProps} props
 */
export function InitError(props: InitErrorProps) {
  const {error} = props;

  return (
    <Wrap className="section-wrapper">
      <Header />

      <FadeIn>
        <div
          style={{
            padding: '2em 1em 1em',
            textAlign: 'center',
          }}>
          <h1 style={{fontSize: '2rem'}}>
            <span
              className="pulse"
              role="img"
              aria-label="Emoji with eyes crossed out."
              style={{display: 'inline-block'}}>
              😵
            </span>{' '}
            Oops, something went wrong.
          </h1>
        </div>

        <div
          style={{
            textAlign: 'center',
            maxWidth: 600,
            display: 'block',
            margin: '0 auto',
          }}>
          <ErrorMessageWithDetails error={error} renderText="" />
        </div>
      </FadeIn>
    </Wrap>
  );
}
