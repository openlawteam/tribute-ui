import {formatBytes32String} from 'ethers/lib/utils';
import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';

import {CHAINS} from './config';
import {connectModalClose, connectModalOpen} from './store/actions';
import {useHistory} from 'react-router';
import GlobalConnectWalletModal from './GlobalConnectWalletModal';
import Wrapper from './test/Wrapper';

describe('GlobalConnectWalletModal unit tests', () => {
  test('should render modal when open', async () => {
    let store: Store;

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <GlobalConnectWalletModal />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    await waitFor(() => {
      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });
  });

  test('should not render modal, if closed', async () => {
    let store: Store;

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <GlobalConnectWalletModal />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    await waitFor(() => {
      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      store.dispatch(connectModalClose());
    });

    // Assert modal closed
    await waitFor(() => {
      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^choose your wallet$/i)).toThrow();
      expect(() => screen.getByText(/^0x04028/i)).toThrow();
      expect(() => screen.getByText(/^metamask$/i)).toThrow();
      expect(() => screen.getByText(/^walletconnect$/i)).toThrow();
      expect(() => screen.getByText(/^disconnect wallet$/i)).toThrow();
    });
  });

  test('should automatically render modal when wrong chain', async () => {
    render(
      <Wrapper
        useWallet
        web3ModalContext={{
          networkId: CHAINS.MAINNET,
        }}>
        <GlobalConnectWalletModal />
      </Wrapper>
    );

    // Assert modal open
    await waitFor(() => {
      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();

      expect(
        screen.getByText(/waiting for the right network/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/please connect to the Ganache Test Network/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/switch networks from your wallet/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();

      // Assert should not be shown
      expect(() => screen.getByText(/^choose your wallet$/i)).toThrow();
      expect(() => screen.getByText(/^metamask$/i)).toThrow();
      expect(() => screen.getByText(/^walletconnect$/i)).toThrow();
    });
  });

  test('should automatically render modal when wrong chain, and `pathname` changes', async () => {
    let store: Store;
    let history: ReturnType<typeof useHistory>;

    function TestApp() {
      history = useHistory();

      return <GlobalConnectWalletModal />;
    }

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;
        }}
        web3ModalContext={{
          networkId: CHAINS.MAINNET,
        }}>
        <TestApp />
      </Wrapper>
    );

    // Assert modal open
    await waitFor(() => {
      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();

      expect(
        screen.getByText(/waiting for the right network/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/please connect to the Ganache Test Network/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/switch networks from your wallet/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();

      // Assert should not be shown
      expect(() => screen.getByText(/^choose your wallet$/i)).toThrow();
      expect(() => screen.getByText(/^metamask$/i)).toThrow();
      expect(() => screen.getByText(/^walletconnect$/i)).toThrow();
    });

    await waitFor(() => {
      store.dispatch(connectModalClose());
    });

    // Assert modal closed
    await waitFor(() => {
      expect(() =>
        screen.getByText(/waiting for the right network/i)
      ).toThrow();
    });

    // Change pages
    await waitFor(() => {
      history.push(`/members`);
    });

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(/waiting for the right network/i)
      ).toBeInTheDocument();
    });
  });

  test('should automatically render modal when contract wallet connected', async () => {
    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          // Mock internal `ethers` call to `eth_chainId`
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock call to `eth_getCode`
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter(
              'bytes',
              formatBytes32String('some code at an address')
            )
          );
        }}>
        <GlobalConnectWalletModal />
      </Wrapper>
    );

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(/smart contract wallets are not currently supported/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });
  });

  test('should automatically render modal when contract wallet connected, and `pathname` changes', async () => {
    let store: Store;
    let history: ReturnType<typeof useHistory>;

    function TestApp() {
      history = useHistory();

      return <GlobalConnectWalletModal />;
    }

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;

          // Mock internal `ethers` call to `eth_chainId`
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter('uint256', 1337)
          );

          // Mock call to `eth_getCode`
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter(
              'bytes',
              formatBytes32String('some code at an address')
            )
          );
        }}>
        <TestApp />
      </Wrapper>
    );

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(/smart contract wallets are not currently supported/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      store.dispatch(connectModalClose());
    });

    // Assert modal closed
    await waitFor(() => {
      expect(() =>
        screen.getByText(/smart contract wallets are not currently supported/i)
      ).toThrow();
    });

    // Change pages
    await waitFor(() => {
      history.push(`/members`);
    });

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(/smart contract wallets are not currently supported/i)
      ).toBeInTheDocument();
    });
  });
});
