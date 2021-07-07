import {render, screen, waitFor, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {COUPON_API_URL} from '../../config';
import {server, rest} from '../../test/server';
import {
  DEFAULT_DAO_REGISTRY_ADDRESS,
  DEFAULT_ETH_ADDRESS,
  DEFAULT_SIG,
  FakeHttpProvider,
} from '../../test/helpers';
import {
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../../test/web3Responses';
import Redeem from './Redeem';
import Wrapper from '../../test/Wrapper';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';

const redeemables = [
  {
    amount: 10000,
    isRedeemd: false,
    recipient: DEFAULT_ETH_ADDRESS,
    signature: DEFAULT_SIG,
    nonce: 53,
    dao: {daoAddress: DEFAULT_DAO_REGISTRY_ADDRESS},
  },
];

describe('RedeemManager unit tests', () => {
  test('should render message when signature missing', async () => {
    render(
      <Wrapper useWallet useInit>
        <Redeem />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/redeem coupon to issue the membership tokens/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/coupon signature missing/i)).toBeInTheDocument();
    });
  });

  test('should redeem coupon', async () => {
    server.use(
      rest.post(`${COUPON_API_URL}/api/coupon/redeem`, (_, res, ctx) => {
        return res(ctx.json(redeemables));
      })
    );

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useWallet
        useInit
        routeEntries={[{search: `?coupon=${DEFAULT_SIG}`}]}
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Redeem />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/redeem coupon to issue the membership tokens/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/checking… please wait/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient/i)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeEnabled();
    });

    act(() => {
      // Click to redeem coupon
      userEvent.click(screen.getByRole('button', {name: /redeem/i}));
    });

    await waitFor(() => {
      // Mock the RPC calls for `redeemCoupon`
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/awaiting your confirmation/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
      expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/🥳/)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeemed!/i})).toBeDisabled();
      expect(screen.getByText(/finalized!/i)).toBeInTheDocument();
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });
});
