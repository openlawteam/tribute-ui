import {renderHook, act} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {
  ethBlockNumber,
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../test/web3Responses';
import {COUPON_API_URL} from '../config';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../test/helpers';
import {rest, server} from '../test/server';
import {useRedeemCoupon, FetchStatus} from '.';
import {Web3TxStatus} from '../components/web3/types';
import Wrapper from '../test/Wrapper';

describe('useRedeemCoupon unit tests', () => {
  test('should return correct data when wallet is disconnected', async () => {
    const {result} = renderHook(() => useRedeemCoupon(), {
      initialProps: {
        useInit: true,
      },
      wrapper: Wrapper,
    });

    // Assert initial state
    expect(result.current.isInProcessOrDone).toBe(false);
    expect(result.current.redeemCoupon).toBeInstanceOf(Function);
    expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
    expect(result.current.submitError).toBe(undefined);
    expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
    expect(result.current.txError).toBe(undefined);
    expect(result.current.txEtherscanURL).toBe('');
    expect(result.current.txIsPromptOpen).toBe(false);
  });

  test('should throw rejection when coupon data is empty', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForNextUpdate, waitForValueToChange} =
        await renderHook(() => useRedeemCoupon(), {
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
          wrapper: Wrapper,
        });

      // Assert initial state
      expect(result.current.isInProcessOrDone).toBe(false);
      expect(result.current.redeemCoupon).toBeInstanceOf(Function);
      expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
      expect(result.current.submitError).toBe(undefined);
      expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);

      // wait for DaoRegistry & CouponOnboarding contracts from store
      await waitForNextUpdate();
      await waitForNextUpdate();

      act(() => {
        mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
        mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
        mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
        mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
        mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

        // Run redeem coupon without the proper arguments
        result.current.redeemCoupon({});
      });

      await waitForValueToChange(() => result.current.submitStatus);

      expect(result.current.submitStatus).toMatch(FetchStatus.REJECTED);
    });
  });

  test('should redeem coupon', async () => {
    const redeemableCoupon = {
      recipient: DEFAULT_ETH_ADDRESS,
      signature:
        '0x75508974ae5ac12d67e60d5758499e7c4811a2e7c5f50281745b7eaffc695d374ad5b537d877e589c10b0971f25193ad99b51c759b0432fbd1932be5fb118fb51c',
      nonce: 1,
      amount: 10000,
      dao: {daoAddress: '0x7BBAfD0edD40AeFAb0e93816DB5154E98f618103'},
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForNextUpdate, waitForValueToChange} =
        await renderHook(() => useRedeemCoupon(), {
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },

          wrapper: Wrapper,
        });

      // Assert initial state
      expect(result.current.isInProcessOrDone).toBe(false);
      expect(result.current.redeemCoupon).toBeInstanceOf(Function);
      expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
      expect(result.current.submitError).toBe(undefined);
      expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);

      // wait for DaoRegistry & CouponOnboarding contracts from store
      await waitForNextUpdate();
      await waitForNextUpdate();

      act(() => {
        // Mock tx result
        mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
        mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
        mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
        mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
        mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

        // Run redeem coupon
        result.current.redeemCoupon(redeemableCoupon);
      });

      expect(result.current.txStatus).toMatch(Web3TxStatus.AWAITING_CONFIRM);
      expect(result.current.txIsPromptOpen).toBe(true);

      await waitForValueToChange(() => result.current.txStatus);

      expect(result.current.txStatus).toMatch(Web3TxStatus.PENDING);

      await waitFor(() => {
        // Mock `getConnectedMember`
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_ETH_ADDRESS
                ),
                // For `members` call
                web3Instance.eth.abi.encodeParameter('uint8', '1'),
                // For `isActiveMember` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `getCurrentDelegateKey` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_ETH_ADDRESS
                ),
              ],
            ]
          ),
          {debugName: '`getConnectedMember`'}
        );
      });

      await waitFor(() => {
        expect(result.current.isInProcessOrDone).toBe(true);
        expect(result.current.submitError).toBe(undefined);
        expect(result.current.submitStatus).toMatch(FetchStatus.FULFILLED);
        expect(result.current.txError).toBe(undefined);
        // No etherscan URL for Ganache
        expect(result.current.txEtherscanURL).toBe('');
        expect(result.current.txIsPromptOpen).toBe(false);
        expect(result.current.txStatus).toMatch(Web3TxStatus.FULFILLED);
      });
    });
  });

  test('should return correct data when tx error', async () => {
    const redeemableCoupon = {
      recipient: DEFAULT_ETH_ADDRESS,
      signature:
        '0x75508974ae5ac12d67e60d5758499e7c4811a2e7c5f50281745b7eaffc695d374ad5b537d877e589c10b0971f25193ad99b51c759b0432fbd1932be5fb118fb51c',
      nonce: 1,
      amount: 10000,
      dao: {daoAddress: '0x7BBAfD0edD40AeFAb0e93816DB5154E98f618103'},
    };

    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useRedeemCoupon(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
            },
          },

          wrapper: Wrapper,
        }
      );

      // Assert initial state
      expect(result.current.isInProcessOrDone).toBe(false);
      expect(result.current.redeemCoupon).toBeInstanceOf(Function);
      expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
      expect(result.current.submitError).toBe(undefined);
      expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);

      // wait for DaoRegistry & CouponOnboarding contracts from store
      await waitForNextUpdate();
      await waitForNextUpdate();

      act(() => {
        // Mock tx error
        mockWeb3Provider.injectError({code: 1234, message: 'Some tx error'});

        // Run redeem coupon
        result.current.redeemCoupon(redeemableCoupon);
      });

      expect(result.current.txStatus).toMatch(Web3TxStatus.AWAITING_CONFIRM);
      expect(result.current.txIsPromptOpen).toBe(true);

      await waitFor(() => {
        expect(result.current.isInProcessOrDone).toBe(false);
        expect(result.current.submitError?.message).toMatch(/some tx error/i);
        expect(result.current.submitStatus).toMatch(FetchStatus.REJECTED);
        expect(result.current.txError?.message).toMatch(/some tx error/i);
        // No etherscan URL for Ganache
        expect(result.current.txEtherscanURL).toBe('');
        expect(result.current.txIsPromptOpen).toBe(false);
        expect(result.current.txStatus).toMatch(Web3TxStatus.REJECTED);
      });
    });
  });

  test('should return correct data when server HTTP error', async () => {
    // Mock HTTP error
    server.use(
      rest.patch(
        `${COUPON_API_URL}/api/coupon/redeem`,
        async (_req, res, ctx) => res(ctx.status(500))
      )
    );

    const redeemableCoupon = {
      recipient: DEFAULT_ETH_ADDRESS,
      signature:
        '0x75508974ae5ac12d67e60d5758499e7c4811a2e7c5f50281745b7eaffc695d374ad5b537d877e589c10b0971f25193ad99b51c759b0432fbd1932be5fb118fb51c',
      nonce: 1,
      amount: 10000,
      dao: {daoAddress: '0x7BBAfD0edD40AeFAb0e93816DB5154E98f618103'},
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForNextUpdate, waitForValueToChange} =
        await renderHook(() => useRedeemCoupon(), {
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },

          wrapper: Wrapper,
        });

      // Assert initial state
      expect(result.current.isInProcessOrDone).toBe(false);
      expect(result.current.redeemCoupon).toBeInstanceOf(Function);
      expect(result.current.submitStatus).toMatch(FetchStatus.STANDBY);
      expect(result.current.submitError).toBe(undefined);
      expect(result.current.txStatus).toBe(Web3TxStatus.STANDBY);
      expect(result.current.txError).toBe(undefined);
      expect(result.current.txEtherscanURL).toBe('');
      expect(result.current.txIsPromptOpen).toBe(false);

      // wait for DaoRegistry & CouponOnboarding contracts from store
      await waitForNextUpdate();
      await waitForNextUpdate();

      act(() => {
        // Mock tx result
        mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
        mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
        mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
        mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
        mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

        // Run redeem coupon
        result.current.redeemCoupon(redeemableCoupon);
      });

      expect(result.current.txStatus).toMatch(Web3TxStatus.AWAITING_CONFIRM);
      expect(result.current.txIsPromptOpen).toBe(true);

      await waitForValueToChange(() => result.current.txStatus);

      expect(result.current.txStatus).toMatch(Web3TxStatus.PENDING);

      await waitFor(() => {
        // Mock `getConnectedMember`
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `getAddressIfDelegated` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_ETH_ADDRESS
                ),
                // For `members` call
                web3Instance.eth.abi.encodeParameter('uint8', '1'),
                // For `isActiveMember` call
                web3Instance.eth.abi.encodeParameter('bool', true),
                // For `getCurrentDelegateKey` call
                web3Instance.eth.abi.encodeParameter(
                  'address',
                  DEFAULT_ETH_ADDRESS
                ),
              ],
            ]
          ),
          {debugName: '`getConnectedMember`'}
        );
      });

      await waitFor(() => {
        expect(result.current.submitError?.message).toMatch(
          /something went wrong while updating the coupon\./i
        );

        expect(result.current.isInProcessOrDone).toBe(false);
        expect(result.current.submitStatus).toMatch(FetchStatus.REJECTED);
        expect(result.current.txError).toBe(undefined);

        // No etherscan URL for Ganache
        expect(result.current.txEtherscanURL).toBe('');
        expect(result.current.txIsPromptOpen).toBe(false);
        expect(result.current.txStatus).toMatch(Web3TxStatus.FULFILLED);
      });
    });
  });
});
