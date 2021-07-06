import {render, screen, waitFor, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../../test/web3Responses';
import RedeemManager from './RedeemManager';
import Wrapper from '../../test/Wrapper';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';

const redeemables = [
  {
    recipient: DEFAULT_ETH_ADDRESS,
    amount: 10000,
    isRedeemd: false,
  },
];

describe('RedeemManager unit tests', () => {
  test('should render redeem card', async () => {
    render(
      <Wrapper useWallet useInit>
        <RedeemManager redeemables={redeemables} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/recipient/i)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeInTheDocument();
    });
  });

  test('should redeem coupon', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useWallet
        useInit
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <RedeemManager redeemables={redeemables} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/recipient/i)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeEnabled();
    });

    // act(() => {
    //   userEvent.click(screen.getByRole('button', {name: /redeem/i}));
    // });

    // await waitFor(() => {
    //   expect(
    //     screen.getByText(/awaiting your confirmation/i)
    //   ).toBeInTheDocument();
    // });

    // await waitFor(() => {
    //   expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
    //   expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    // });

    // await waitFor(() => {
    //   // Mock the RPC calls for `redeemCoupon`
    //   mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
    //   mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
    //   mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
    //   mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));

    //   expect(screen.getByRole('button', {name: /redeem/i})).toBeDisabled();
    //   expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    // });

    // await waitFor(() => {
    //   expect(screen.getByRole('button', {name: /redeem/i})).toBeDisabled();
    //   expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    // });
  });
});
