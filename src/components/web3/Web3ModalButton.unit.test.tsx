import {render, waitFor, screen} from '@testing-library/react';
import Core from 'web3modal';
import userEvent from '@testing-library/user-event';

import {CHAINS} from '../../config';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {REVERSE_RECORDS_ADDRESS} from './helpers';
import {truncateEthAddress} from '../../util/helpers';
import Web3ModalButton from './Web3ModalButton';
import Wrapper from '../../test/Wrapper';

describe('Web3ModalButton unit tests', () => {
  test('should render button in connected state', async () => {
    render(
      <Wrapper
        useWallet
        web3ModalContext={{
          web3Modal: {cachedProvider: 'injected'} as Core,
        }}>
        <Web3ModalButton />
      </Wrapper>
    );

    // Assert connected
    await waitFor(() => {
      expect(screen.getByText(/^0x040/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^metamask logo/i)).toBeInTheDocument();
    });
  });

  test('should render button in disconnected state', async () => {
    render(
      <Wrapper
        useWallet
        web3ModalContext={{connected: false, account: undefined}}>
        <Web3ModalButton />
      </Wrapper>
    );

    // Assert disconnected
    await waitFor(() => {
      expect(screen.getByText(/connect/i)).toBeInTheDocument();
    });
  });

  test('should render button with ENS name', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          // Mock the `ReverseRecords.getNames` response
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter('string[]', ['someone.eth'])
          );
        }}
        web3ModalContext={{
          accountENS: 'someone.eth',
          web3Modal: {cachedProvider: 'injected'} as Core,
        }}>
        <Web3ModalButton />
      </Wrapper>
    );

    // Assert connected
    await waitFor(() => {
      expect(screen.getByText(/^someone\.eth$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^metamask logo/i)).toBeInTheDocument();
    });

    // Cleanup
    delete REVERSE_RECORDS_ADDRESS[1337];
  });

  test('should render custom wallet text (`String`)', async () => {
    render(
      <Wrapper useWallet>
        <Web3ModalButton customWalletText="You are connected" />
      </Wrapper>
    );

    // Assert disconnected
    await waitFor(() => {
      expect(screen.getByText(/you are connected/i)).toBeInTheDocument();
    });
  });

  test('should render custom wallet text (`Function`)', async () => {
    render(
      <Wrapper useWallet>
        <Web3ModalButton
          customWalletText={({account}) =>
            `${truncateEthAddress(account || '')} 🥳`
          }
        />
      </Wrapper>
    );

    // Assert disconnected
    await waitFor(() => {
      expect(screen.getByText(/^0x040.* 🥳/i)).toBeInTheDocument();
    });
  });

  test('should render correct text when wrong network', async () => {
    render(
      <Wrapper
        useWallet
        web3ModalContext={{
          networkId: CHAINS.MAINNET,
        }}>
        <Web3ModalButton />
      </Wrapper>
    );

    // Assert disconnected
    await waitFor(() => {
      expect(screen.getByText(/^0x040/i)).toBeInTheDocument();
      expect(screen.getByText(/^wrong network$/i)).toBeInTheDocument();
    });
  });

  test('should not render wallet badge', async () => {
    render(
      <Wrapper
        useWallet
        web3ModalContext={{
          web3Modal: {cachedProvider: 'injected'} as Core,
        }}>
        <Web3ModalButton showWalletETHBadge={false} />
      </Wrapper>
    );

    // Assert connected
    await waitFor(() => {
      expect(screen.getByText(/^0x040/i)).toBeInTheDocument();
      expect(() => screen.getByLabelText(/^metamask logo/i)).toThrow();
    });
  });

  test('can click button', async () => {
    const actionsToMock = await import('../../store/connectModal/actions');

    const mock = jest.spyOn(actionsToMock, 'connectModalOpen');

    render(
      <Wrapper useWallet>
        <Web3ModalButton />
      </Wrapper>
    );

    // Assert connected
    await waitFor(() => {
      expect(screen.getByText(/^0x040/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/^0x040/i));

    await waitFor(() => {
      expect(mock.mock.calls.length).toBe(1);
    });
  });
});
