import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';

import {connectModalClose, connectModalOpen} from './store/actions';
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
});
