import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';
import {useDispatch, useSelector} from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  connectModalClose,
  connectModalOpen,
  setConnectedMember,
} from '../../store/actions';
import {CHAINS} from '../../config';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {REVERSE_RECORDS_ADDRESS} from './helpers';
import {StoreState} from '../../store/types';
import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router';
import ConnectWalletModal from './ConnectWalletModal';
import Wrapper from '../../test/Wrapper';

describe('ConnectWalletModal unit tests', () => {
  test('should open modal', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <TestApp />
      </Wrapper>
    );

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

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert modal open
    await waitFor(() => {
      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });
  });

  test('should show ENS address', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        web3ModalContext={{accountENS: 'someone.eth'}}
        getProps={(p) => {
          store = p.store;
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert ENS
    await waitFor(() => {
      expect(screen.getByText(/^someone\.eth$/i)).toBeInTheDocument();
    });

    // Cleanup
    delete REVERSE_RECORDS_ADDRESS[1337];
  });

  test('should show "copy" tooltip for account address', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    const {getByText} = render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert account
    await waitFor(() => {
      expect(screen.getByText(DEFAULT_ETH_ADDRESS)).toBeInTheDocument();
    });

    userEvent.click(getByText(DEFAULT_ETH_ADDRESS));

    // Assert tooltip text
    await waitFor(() => {
      expect(getByText(/copied!/i)).toBeInTheDocument();
    });

    // Assert tooltip text reset
    await waitFor(
      () => {
        expect(getByText(/copy/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );
  });

  test('should show "copy" tooltip for ENS address', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    const {getByText} = render(
      <Wrapper
        useWallet
        web3ModalContext={{accountENS: 'someone.eth'}}
        getProps={(p) => {
          store = p.store;

          // Mock the `ReverseRecords.getNames` response
          p.mockWeb3Provider.injectResult(
            p.web3Instance.eth.abi.encodeParameter('string[]', ['someone.eth'])
          );
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert ENS
    await waitFor(() => {
      expect(screen.getByText(/^someone\.eth$/i)).toBeInTheDocument();
    });

    userEvent.click(getByText(/^someone\.eth$/i));

    // Assert tooltip text
    await waitFor(() => {
      expect(getByText(/copied!/i)).toBeInTheDocument();
    });

    // Assert tooltip text reset
    await waitFor(
      () => {
        expect(getByText(/someone\.eth \(.*\)/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    // Cleanup
    delete REVERSE_RECORDS_ADDRESS[1337];
  });

  test('should close modal', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={(p) => {
          store = p.store;

          store.dispatch(connectModalOpen());
        }}>
        <TestApp />
      </Wrapper>
    );

    // Assert modal open
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

  test('should close modal after clicking "set a delegate" link, then navigating to member profile page', async () => {
    let store: Store;
    let pathname: string;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      const location = useLocation();

      pathname = location.pathname;

      return (
        <ConnectWalletModal
          maybeContractWallet={true}
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;

          // Set connected member to active
          p.store.dispatch(
            setConnectedMember({
              ...p.store.getState().connectedMember,
              isActiveMember: true,
              memberAddress: DEFAULT_ETH_ADDRESS,
            })
          );
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByRole('link', {name: /set a delegate/i})
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('link', {name: /set a delegate/i}));

    // Assert modal closed
    await waitFor(() => {
      expect(pathname).toBe(`/members/${DEFAULT_ETH_ADDRESS}`);

      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^choose your wallet$/i)).toThrow();
      expect(() => screen.getByText(/^0x04028/i)).toThrow();
      expect(() => screen.getByText(/^metamask$/i)).toThrow();
      expect(() => screen.getByText(/^walletconnect$/i)).toThrow();
      expect(() => screen.getByText(/^disconnect wallet$/i)).toThrow();
    });
  });

  test('should close modal after clicking "set a delegate" link when already on member profile page', async () => {
    let store: Store;
    let pathname: string;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      const history = useHistory();
      const location = useLocation();

      useEffect(() => {
        history.push(`/members/${DEFAULT_ETH_ADDRESS}`);
      }, [history]);

      pathname = location.pathname;

      return (
        <ConnectWalletModal
          maybeContractWallet={true}
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;

          // Set connected member to active
          p.store.dispatch(
            setConnectedMember({
              ...p.store.getState().connectedMember,
              isActiveMember: true,
              memberAddress: DEFAULT_ETH_ADDRESS,
            })
          );
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert modal open
    await waitFor(() => {
      expect(pathname).toBe(`/members/${DEFAULT_ETH_ADDRESS}`);

      expect(
        screen.getByRole('link', {name: /set a delegate/i})
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('link', {name: /set a delegate/i}));

    // Assert modal closed
    await waitFor(() => {
      expect(pathname).toBe(`/members/${DEFAULT_ETH_ADDRESS}`);

      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^connect wallet$/i)).toThrow();
      expect(() => screen.getByText(/^choose your wallet$/i)).toThrow();
      expect(() => screen.getByText(/^0x04028/i)).toThrow();
      expect(() => screen.getByText(/^metamask$/i)).toThrow();
      expect(() => screen.getByText(/^walletconnect$/i)).toThrow();
      expect(() => screen.getByText(/^disconnect wallet$/i)).toThrow();
    });
  });

  test('render correct content when network is wrong', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;
        }}
        web3ModalContext={{
          networkId: CHAINS.MAINNET,
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

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

  test('render correct content when contract wallet connected', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          maybeContractWallet={true}
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(
          /smart contract wallets are not generally supported for features like off-chain voting/i
        )
      ).toBeInTheDocument();

      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });
  });

  test('render correct content when contract wallet connected, and is member', async () => {
    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          maybeContractWallet={true}
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;

          // Set connected member to active
          p.store.dispatch(
            setConnectedMember({
              ...p.store.getState().connectedMember,
              isActiveMember: true,
            })
          );
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    // Assert modal open
    await waitFor(() => {
      expect(
        screen.getByText(
          /smart contract wallets are not generally supported for features like off-chain voting\. as a member, you can/i
        )
      ).toBeInTheDocument();

      expect(screen.getByText(/set a delegate/i)).toBeInTheDocument();

      expect(
        screen.getByText(/to a key-based wallet, like metamask/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/^connect wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^choose your wallet$/i)).toBeInTheDocument();
      expect(screen.getByText(/^0x04028/i)).toBeInTheDocument();
      expect(screen.getByText(/^metamask$/i)).toBeInTheDocument();
      expect(screen.getByText(/^walletconnect$/i)).toBeInTheDocument();
      expect(screen.getByText(/^disconnect wallet$/i)).toBeInTheDocument();
    });
  });

  test('can call `connectWeb3Modal` when providers clicked', async () => {
    const spy = jest.fn();

    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    // Mock default chain so we can click `"walletconnect"`
    const useIsDefaultChainToMock = await import('./hooks/useIsDefaultChain');

    const mock = jest
      .spyOn(useIsDefaultChainToMock, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;
        }}
        web3ModalContext={{
          connectWeb3Modal: spy,
          networkId: CHAINS.MAINNET,
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    userEvent.click(screen.getByRole('button', {name: /metamask/i}));

    // Assert `"injected"` was clicked
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe('injected');
    });

    userEvent.click(screen.getByRole('button', {name: /walletconnect/i}));

    // Assert `"walletconnect"` was clicked
    await waitFor(() => {
      expect(spy.mock.calls[1][0]).toBe('walletconnect');
    });

    // Restore `useIsDefaultChain`
    mock.mockRestore();
  });

  test('can disable `"walletconnect"` when chain is ganache', async () => {
    const spy = jest.fn();

    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;
        }}
        web3ModalContext={{
          connectWeb3Modal: spy,
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    expect(screen.getByRole('button', {name: /metamask/i})).toBeEnabled();

    userEvent.click(screen.getByRole('button', {name: /metamask/i}));

    // Assert `"injected"` was clicked
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe('injected');
    });

    expect(screen.getByRole('button', {name: /walletconnect/i})).toBeDisabled();

    userEvent.click(screen.getByRole('button', {name: /walletconnect/i}));

    // Assert `"walletconnect"` was clicked
    await waitFor(() => {
      expect(spy.mock.calls[1]).toBe(undefined);
    });
  });

  test('can remove `"injected"` provider option when device is mobile', async () => {
    // Mock @walletconnect's `isMobile: () => boolean`
    const walletConnectUtils = await import(
      '@walletconnect/browser-utils/dist/cjs/browser'
    );

    const isMobileMock = jest
      .spyOn(walletConnectUtils, 'isMobile')
      .mockImplementation(() => true);

    let store: Store;

    function TestApp() {
      const dispatch = useDispatch();

      const isOpen = useSelector(
        ({connectModal}: StoreState) => connectModal.isOpen
      );

      return (
        <ConnectWalletModal
          modalProps={{
            isOpen,
            onRequestClose: () => {
              dispatch(connectModalClose());
            },
          }}
        />
      );
    }

    render(
      <Wrapper
        useWallet
        getProps={async (p) => {
          store = p.store;
        }}>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      store.dispatch(connectModalOpen());
    });

    await waitFor(() => {
      expect(() => screen.getByRole('button', {name: /metamask/i})).toThrow();

      expect(
        screen.getByRole('button', {name: /walletconnect/i})
      ).toBeInTheDocument();
    });

    // Reset to original value
    isMobileMock.mockRestore();
  });
});
