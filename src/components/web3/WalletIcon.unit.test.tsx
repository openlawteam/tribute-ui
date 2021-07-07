import {render, screen, waitFor} from '@testing-library/react';

import {WalletIcon} from './WalletIcon';

describe('WalletIcon unit tests', () => {
  test('should return MetaMask icon', async () => {
    render(<WalletIcon providerName="injected" />);

    // Assert no content while lazy loading
    expect(() => screen.getAllByRole('img')).toThrow();

    await waitFor(() => {
      expect(screen.getByLabelText(/metamask logo/i)).toBeInTheDocument();
    });
  });

  test('should return WalletConnect icon', async () => {
    render(<WalletIcon providerName="walletconnect" />);

    // Assert no content while lazy loading
    expect(() => screen.getAllByRole('img')).toThrow();

    await waitFor(() => {
      expect(screen.getByLabelText(/walletconnect logo/i)).toBeInTheDocument();
    });
  });

  test('should return no icon if empty provider name', async () => {
    render(<WalletIcon providerName="" />);

    await waitFor(() => {
      expect(() => screen.getAllByRole('img')).toThrow();
    });
  });

  test('should return no icon if bad provider name', async () => {
    render(<WalletIcon providerName="badName" />);

    await waitFor(() => {
      expect(() => screen.getAllByRole('img')).toThrow();
    });
  });
});
