import React, {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {
  initWeb3Instance,
  setConnectedAddress,
  walletAuthenticated,
} from './store/actions';
import {useInitContracts} from './hooks';
import {ReduxDispatch} from './util/types';
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
   * Effects
   */

  // Here we check for wallet connection changes and init updates
  // to the app contracts, web3, wallet connected state, and wallet address
  useEffect(() => {
    const selectedAddress: string = account?.toLowerCase() ?? '';

    // init contracts if connected or reset connection state
    if (connected && selectedAddress) {
      initContracts();
    }

    // set web3 instance
    web3Instance && dispatch(initWeb3Instance(web3Instance));

    // set wallet auth
    dispatch(walletAuthenticated(connected === true));

    // set the address of the connected user
    dispatch(setConnectedAddress(selectedAddress));
  }, [account, connected, dispatch, initContracts, web3Instance]);

  // Init the contracts used in the dApp,
  // we do not need to wait for it to be ready
  useEffect(() => {
    try {
      connected && provider && web3Instance && initContracts();
    } catch (error) {
      setError(error);
    }
  }, [connected, provider, web3Instance, initContracts]);

  /**
   * Functions
   */

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
