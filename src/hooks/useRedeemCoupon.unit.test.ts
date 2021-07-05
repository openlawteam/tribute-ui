import {renderHook, act} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {useRedeemCoupon, FetchStatus} from '.';
import {Web3TxStatus} from '../components/web3/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../test/helpers';
import Wrapper from '../test/Wrapper';
import {
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../test/web3Responses';

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
    const {result, waitForNextUpdate, waitForValueToChange} = renderHook(
      () => useRedeemCoupon(),
      {
        initialProps: {
          useInit: true,
          useWallet: true,
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

    act(() => {
      result.current.redeemCoupon({});
    });

    await waitForValueToChange(() => result.current.submitStatus);

    expect(result.current.submitStatus).toMatch(FetchStatus.REJECTED);
  });

  test('should redeem coupon', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForNextUpdate, waitForValueToChange} = renderHook(
      () => useRedeemCoupon(),
      {
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
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

    const redeemableCoupon = {
      recipient: DEFAULT_ETH_ADDRESS,
      signature:
        '0x75508974ae5ac12d67e60d5758499e7c4811a2e7c5f50281745b7eaffc695d374ad5b537d877e589c10b0971f25193ad99b51c759b0432fbd1932be5fb118fb51c',
      nonce: 1,
      amount: 10000,
      dao: {daoAddress: '0x7BBAfD0edD40AeFAb0e93816DB5154E98f618103'},
    };

    act(() => {
      result.current.redeemCoupon(redeemableCoupon);
    });

    expect(result.current.submitStatus).toMatch(FetchStatus.PENDING);
    expect(result.current.txStatus).toMatch(Web3TxStatus.AWAITING_CONFIRM);

    await waitForValueToChange(() => result.current.txStatus);

    expect(result.current.txStatus).toMatch(Web3TxStatus.PENDING);
    expect(result.current.isInProcessOrDone).toBe(true);

    // Setup: Mock RPC calls for `redeemCoupon`
    await act(async () => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

      await waitForNextUpdate();

      expect(result.current.txStatus).toMatch(Web3TxStatus.FULFILLED);
      expect(result.current.isInProcessOrDone).toBe(true);
      expect(result.current.txIsPromptOpen).toBe(false);
    });
  });
});
