import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {
  DEFAULT_DAO_REGISTRY_ADDRESS,
  DEFAULT_ETH_ADDRESS,
  DEFAULT_SIG,
  FakeHttpProvider,
} from '../../test/helpers';
import {
  ethBlockNumber,
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
} from '../../test/web3Responses';
import {COUPON_API_URL} from '../../config';
import {server, rest} from '../../test/server';
import Redeem from './Redeem';
import Wrapper from '../../test/Wrapper';

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
  test("should check if user doesn't have a connected wallet", async () => {
    render(
      <Wrapper useInit>
        <Redeem />
      </Wrapper>
    );

    expect(
      screen.getByText(/redeem coupon to issue the membership tokens/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/connect your wallet to view the coupon/i)
    ).toBeInTheDocument();
  });

  test('should render error message when signature missing', async () => {
    render(
      <Wrapper useWallet useInit>
        <Redeem />
      </Wrapper>
    );

    expect(
      screen.getByText(/redeem coupon to issue the membership tokens/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/checking… please wait/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/coupon signature missing/i)
    ).toBeInTheDocument();
  });

  test('should render error message when signature provided, but incorrect', async () => {
    server.use(
      rest.post(`${COUPON_API_URL}/api/coupon/redeem`, (_, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <Wrapper
        useWallet
        useInit
        locationEntries={[{search: `?coupon=${DEFAULT_SIG}`}]}>
        <Redeem />
      </Wrapper>
    );

    expect(
      screen.getByText(/redeem coupon to issue the membership tokens/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/checking… please wait/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/coupon not found/i)).toBeInTheDocument();
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
        locationEntries={[{search: `?coupon=${DEFAULT_SIG}`}]}
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Redeem />
      </Wrapper>
    );

    expect(
      screen.getByText(/redeem coupon to issue the membership tokens/i)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/checking… please wait/i)
    ).toBeInTheDocument();

    expect(await screen.findByText(/recipient/i)).toBeInTheDocument();
    expect(await screen.findByText(/^0x04028/i)).toBeInTheDocument();
    expect(await screen.findByText(/^10,000/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /redeem/i})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeem/i})).toBeEnabled();
    });

    await waitFor(() => {
      // Mock the RPC calls for `redeemCoupon`
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    // Click to redeem coupon
    userEvent.click(screen.getByRole('button', {name: /redeem/i}));

    await waitFor(() => {
      expect(
        screen.getByText(/awaiting your confirmation/i)
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/🥳/)).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /redeemed!/i})).toBeDisabled();
      expect(screen.getByText(/finalized!/i)).toBeInTheDocument();
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });
});
