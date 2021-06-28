import {render, screen, act, waitFor} from '@testing-library/react';
import {server, graphql} from '../../test/server';

import {
  daoResponse,
  adaptersAndExtensionsResponse,
} from '../../test/gqlResponses';
import Wrapper from '../../test/Wrapper';
import {getWeb3Instance} from '../../test/helpers';
import {initContractDaoRegistry} from '../../store/actions';
import {SET_CONNECTED_MEMBER} from '../../store/actions';
import AdapterOrExtensionManager from './AdapterOrExtensionManager';

describe('<AdapterOrExtensionManager /> unit tests', () => {
  test('should render initial dao manager view without wallet connection', async () => {
    server.use(
      graphql.query('GetAdaptersAndExtensions', (_, res, ctx) => {
        return res(ctx.data({}));
      })
    );

    await act(async () => {
      render(
        <Wrapper useInit>
          <AdapterOrExtensionManager />
        </Wrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/adapter\/extension manager/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /connect your wallet to manage the DAO adapters and extensions/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  test('should not render dao manager if not a member', async () => {
    server.use(
      graphql.query('GetAdaptersAndExtensions', (_, res, ctx) => {
        return res(ctx.data(adaptersAndExtensionsResponse));
      })
    );

    let store: any;

    await act(async () => {
      render(
        <Wrapper
          useInit
          useWallet
          getProps={(p) => {
            store = p.store;
          }}>
          <AdapterOrExtensionManager />
        </Wrapper>
      );

      // Set a non-active member
      store.dispatch({
        type: SET_CONNECTED_MEMBER,
        ...store.getState().connectedMember,
        isActiveMember: false,
      });

      expect(
        screen.getByText(/adapter\/extension manager/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /either you are not a member, or your membership is not active/i
        )
      ).toBeInTheDocument();
    });
  });

  test('should select adapters and/or extensions and configure them', async () => {
    server.use(
      graphql.query('GetDao', (_, res, ctx) => {
        return res(ctx.data(daoResponse));
      })
    );

    server.use(
      graphql.query('GetAdaptersAndExtensions', (_, res, ctx) => {
        return res(ctx.data(adaptersAndExtensionsResponse));
      })
    );

    let store: any;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <AdapterOrExtensionManager />
      </Wrapper>
    );

    // Set active member
    store.dispatch({
      type: SET_CONNECTED_MEMBER,
      ...store.getState().connectedMember,
      isActiveMember: true,
    });

    // Header & Body Text
    await waitFor(async () => {
      expect(
        screen.getByText(/adapter\/extension manager/i)
      ).toBeInTheDocument();

      expect(screen.getByTestId('selectall')).toBeInTheDocument();
      expect(screen.getByTestId('finalizedao')).toBeInTheDocument();
      expect(screen.getByText(/0 selected/i)).toBeInTheDocument();
      expect(screen.getByText(/add selected/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /If you're happy with your setup, you can finalize your DAO. After your DAO is finalized you will need to submit a proposal to make changes/i
        )
      ).toBeInTheDocument();
    });

    const {web3} = getWeb3Instance();

    // Setup for necessary contracts
    store.dispatch(initContractDaoRegistry(web3));
  });
});
