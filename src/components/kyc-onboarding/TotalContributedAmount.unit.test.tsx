import {render, waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {getAssetTransfersFixture} from '../../test/restResponses';
import {server, rest} from '../../test/server';
import {TotalContributedAmount} from './TotalContributedAmount';
import * as config from '../../config';
import Wrapper from '../../test/Wrapper';

const DEFAULT_LOGS_RESULT = [
  {
    address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
    blockHash:
      '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
    blockNumber: 13290895,
    data: '0xb024dc66daa5f76b3a0f3ca4879dc87b33f90cea509e863f3e0955b6222a3a1e000000000000000000000000000000000000000000000002b5e3af16b1880000',
    logIndex: 54,
    removed: false,
    topics: [
      '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
    ],
    transactionHash:
      '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
    transactionIndex: 29,
    id: 'log_79e8ecdf',
  },
];

describe('TotalContributedAmount unit tests', () => {
  test('should render', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import('../web3/hooks/useIsDefaultChain');

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    let mockWeb3Provider: FakeHttpProvider;

    const {getByText} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <TotalContributedAmount multisigAddress={DEFAULT_ETH_ADDRESS} />
      </Wrapper>
    );

    // Assert initial
    await waitFor(() => {
      expect(() => getByText(/eth contributed$/i)).toThrow();
    });

    // Mock web3 repsonse
    await waitFor(() => {
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    });

    await waitFor(() => {
      expect(getByText(/^200 eth contributed$/i)).toBeInTheDocument();
    });

    // Cleanup

    spy.mockRestore();
  });

  test('should render with `render` prop', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import('../web3/hooks/useIsDefaultChain');

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    let mockWeb3Provider: FakeHttpProvider;

    const {getByText} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <TotalContributedAmount
          multisigAddress={DEFAULT_ETH_ADDRESS}
          render={({amountContributed}) => {
            return <div>{amountContributed} ETH is in the DAO</div>;
          }}
        />
      </Wrapper>
    );

    // Assert initial
    await waitFor(() => {
      expect(() => getByText(/eth contributed$/i)).toThrow();
    });

    // Mock web3 repsonse
    await waitFor(() => {
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    });

    await waitFor(() => {
      expect(getByText(/^200 eth is in the dao$/i)).toBeInTheDocument();
    });

    // Cleanup

    spy.mockRestore();
  });

  test('should not render amount if 0', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import('../web3/hooks/useIsDefaultChain');

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    // Mock Alchemy response with non-allowed assets
    server.use(
      rest.post('https://eth-mainnet.alchemyapi.io/v2/*', (req, res, ctx) => {
        const {body} = req;

        if (typeof body === 'object') {
          // `alchemy_getAssetTransfers`
          if (body.method === 'alchemy_getAssetTransfers') {
            return res(
              ctx.json({
                ...getAssetTransfersFixture,
                result: {
                  ...getAssetTransfersFixture.result,
                  transfers: [
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // No value
                      value: 0,
                      erc721TokenId: null,
                      erc1155Metadata: null,
                      asset: 'ETH',
                      category: 'token',
                      rawContract: {
                        value: '0x02b5e3af16b1880000',
                        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        decimal: '0x12',
                      },
                    },
                  ],
                },
              })
            );
          }
        }
      })
    );

    let mockWeb3Provider: FakeHttpProvider;

    const {getByText} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <TotalContributedAmount multisigAddress={DEFAULT_ETH_ADDRESS} />
      </Wrapper>
    );

    // Assert initial
    await waitFor(() => {
      expect(() => getByText(/eth contributed$/i)).toThrow();
    });

    // Mock web3 repsonse
    await waitFor(() => {
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    });

    await waitFor(() => {
      expect(() => getByText(/eth contributed$/i)).toThrow();
    });

    // Cleanup

    spy.mockRestore();
  });

  test('should render formatted amount', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import('../web3/hooks/useIsDefaultChain');

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    // Mock Alchemy response with non-allowed assets
    server.use(
      rest.post('https://eth-mainnet.alchemyapi.io/v2/*', (req, res, ctx) => {
        const {body} = req;

        if (typeof body === 'object') {
          // `alchemy_getAssetTransfers`
          if (body.method === 'alchemy_getAssetTransfers') {
            return res(
              ctx.json({
                ...getAssetTransfersFixture,
                result: {
                  ...getAssetTransfersFixture.result,
                  transfers: [
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // Value to format
                      value: 500000,
                      erc721TokenId: null,
                      erc1155Metadata: null,
                      asset: 'ETH',
                      category: 'token',
                      rawContract: {
                        value: '0x02b5e3af16b1880000',
                        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        decimal: '0x12',
                      },
                    },
                  ],
                },
              })
            );
          }
        }
      })
    );

    let mockWeb3Provider: FakeHttpProvider;

    const {getByText} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <TotalContributedAmount multisigAddress={DEFAULT_ETH_ADDRESS} />
      </Wrapper>
    );

    // Assert initial
    await waitFor(() => {
      expect(() => getByText(/eth contributed$/i)).toThrow();
    });

    // Mock web3 repsonse
    await waitFor(() => {
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    });

    await waitFor(() => {
      expect(getByText(/^500,000 eth contributed/i)).toBeInTheDocument();
    });

    // Cleanup

    spy.mockRestore();
  });
});
