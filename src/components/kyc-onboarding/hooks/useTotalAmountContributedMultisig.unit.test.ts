import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {getAssetTransfersFixture} from '../../../test/restResponses';
import {rest, server} from '../../../test/server';
import {useTotalAmountContributedMultisig} from '.';
import * as config from '../../../config';
import Wrapper from '../../../test/Wrapper';

const originalDefaultChain = config.DEFAULT_CHAIN;

const {FULFILLED, PENDING, REJECTED, STANDBY} = AsyncStatus;

const DEFAULT_LOGS_RESULT = [
  {
    address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
    blockHash:
      '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
    blockNumber: 13290895,
    /**
     * web3Instance.eth.abi.encodeParameters(
     *  ['bytes32', 'uint256'],
     *  [KYC_ONBOARDING_CHUNK_SIZE_CONFIG_KEY_HASH, '50000000000000000000']
     * );
     */
    data: '0x7096823768c7b22c230a00de80487025954817802186dbc0550561c089cceb3f000000000000000000000000000000000000000000000002b5e3af16b1880000',
    logIndex: 54,
    removed: false,
    topics: [
      // sha3('ConfigurationUpdated(bytes32,uint256)');
      '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
    ],
    transactionHash:
      '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
    transactionIndex: 29,
    id: 'log_79e8ecdf',
  },
  {
    address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
    blockHash:
      '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
    blockNumber: 13290895,
    /**
     * web3Instance.eth.abi.encodeParameters(
     *  ['bytes32', 'uint256'],
     *  [KYC_ONBOARDING_MAXIMUM_CHUNKS_CONFIG_KEY_HASH, 3]
     * );
     */
    data: '0x69fca5d139dbd5583b465b34fb3ac5287b00e6ae381ca8d5f3029486f60db9c20000000000000000000000000000000000000000000000000000000000000003',
    logIndex: 55,
    removed: false,
    topics: [
      // sha3('ConfigurationUpdated(bytes32,uint256)');
      '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
    ],
    transactionHash:
      '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
    transactionIndex: 29,
    id: 'log_5118158c',
  },
];

describe('useTotalAmountContributedMultisig unit tests', () => {
  test('should return correct data', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(200);
      expect(result.current.amountContributedStatus).toBe(FULFILLED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when different chunk size configs have been set', async () => {
    const MODIFIED_LOGS_RESULT = [
      ...DEFAULT_LOGS_RESULT,
      {
        address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
        blockHash:
          '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
        blockNumber: 13290895,
        /**
         * web3Instance.eth.abi.encodeParameters(
         *  ['bytes32', 'uint256'],
         *  [KYC_ONBOARDING_CHUNK_SIZE_CONFIG_KEY_HASH, '30000000000000000000']
         * );
         */
        data: '0x7096823768c7b22c230a00de80487025954817802186dbc0550561c089cceb3f000000000000000000000000000000000000000000000001a055690d9db80000',
        logIndex: 56,
        removed: false,
        topics: [
          // sha3('ConfigurationUpdated(bytes32,uint256)');
          '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
        ],
        transactionHash:
          '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
        transactionIndex: 29,
        id: 'log_292c238f',
      },
    ];

    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    // Mock Alchemy response with assets that are multiple of second chunk size
    // config ('30000000000000000000')
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
                    ...getAssetTransfersFixture.result.transfers,
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // multiple of chunk size '30000000000000000000'
                      value: 60, // to wei '60000000000000000000'
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
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(MODIFIED_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(260);
      expect(result.current.amountContributedStatus).toBe(FULFILLED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when non-allowed assets in transfers', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

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
                    ...getAssetTransfersFixture.result.transfers,
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      value: 50,
                      erc721TokenId: null,
                      erc1155Metadata: null,
                      // Use a non-allowed asset to filter out
                      asset: 'BAD',
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
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(200);
      expect(result.current.amountContributedStatus).toBe(FULFILLED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when non-multiple of chunk size in transfers', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

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
                    ...getAssetTransfersFixture.result.transfers,
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // Non-multiple of chunk size
                      value: 1337,
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
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(200);
      expect(result.current.amountContributedStatus).toBe(FULFILLED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when multiple of chunk size, but greater than expected max amount in transfers', async () => {
    const MODIFIED_LOGS_RESULT = [
      ...DEFAULT_LOGS_RESULT,
      {
        address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
        blockHash:
          '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
        blockNumber: 13290895,
        /**
         * web3Instance.eth.abi.encodeParameters(
         *  ['bytes32', 'uint256'],
         *  [KYC_ONBOARDING_CHUNK_SIZE_CONFIG_KEY_HASH, '30000000000000000000']
         * );
         */
        data: '0x7096823768c7b22c230a00de80487025954817802186dbc0550561c089cceb3f000000000000000000000000000000000000000000000001a055690d9db80000',
        logIndex: 56,
        removed: false,
        topics: [
          // sha3('ConfigurationUpdated(bytes32,uint256)');
          '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
        ],
        transactionHash:
          '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
        transactionIndex: 29,
        id: 'log_292c238f',
      },
      {
        address: '0x1D96d039d384d3ECCaD6f07aAB27A49408A1Cf2B',
        blockHash:
          '0xc71df7ee20cb6f91c1b4f78912e8436d57c93f7646f08e19492f47fca331d5d9',
        blockNumber: 13290895,
        /**
         * web3Instance.eth.abi.encodeParameters(
         *  ['bytes32', 'uint256'],
         *  [KYC_ONBOARDING_MAXIMUM_CHUNKS_CONFIG_KEY_HASH, 2]
         * );
         */
        data: '0x69fca5d139dbd5583b465b34fb3ac5287b00e6ae381ca8d5f3029486f60db9c20000000000000000000000000000000000000000000000000000000000000002',
        logIndex: 57,
        removed: false,
        topics: [
          // sha3('ConfigurationUpdated(bytes32,uint256)');
          '0x50bc2a45e7693135e6950fb78733dccb013ce4c6b62f17dbbda5131d8d0fac29',
        ],
        transactionHash:
          '0xae49dbd78d15dd8ce91c4927b93736cbf9e2f129ab1c9a17180702cb1908651b',
        transactionIndex: 29,
        id: 'log_c9710de2',
      },
    ];

    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    // Mock Alchemy response with assets that are greater than expected max
    // contribution amount
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
                    ...getAssetTransfersFixture.result.transfers,
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // multiple of chunk size '30000000000000000000'
                      value: 60, // to wei '60000000000000000000'
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
                    // this large transfer value should be filtered out
                    {
                      blockNum: '0xcace2e',
                      hash: '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
                      from: '0x3e9425919e7f806ff0d4c29869f59e55970385fa',
                      to: '0xa9a70e66830bcf9776c23fb1df708d7ad498e6e6',
                      // greater than (greatest chunk size value
                      // '50000000000000000000') * (greatest maximum chunks
                      // value '3') =  '150000000000000000000'
                      value: 200, // to wei '200000000000000000000'
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
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(MODIFIED_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(260);
      expect(result.current.amountContributedStatus).toBe(FULFILLED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when alchemy error', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    // Mock alchemy error
    server.use(
      rest.post('https://eth-mainnet.alchemyapi.io/v2/*', (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Mock web3 response
      mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert fulfilled
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(REJECTED);

      // Cleanup

      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should return correct data when rpc error', async () => {
    // Mock chain to be production so hook will run
    (config as any).DEFAULT_CHAIN = 1;

    const useIsDefaultChain = await import(
      '../../web3/hooks/useIsDefaultChain'
    );

    // Mock `useDefaultChain` for `Init`; `isDefaultChain` should be `true`
    const spy = jest
      .spyOn(useIsDefaultChain, 'useIsDefaultChain')
      .mockImplementation(() => ({
        defaultChain: 1,
        defaultChainError: undefined,
        isDefaultChain: true,
      }));

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps(p) {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      // Mock Web3 result for `getAddressConfiguration.call()`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(PENDING);

      // Wait for the other web3 app calls to complete
      await new Promise((r) => setTimeout(r, 0));

      mockWeb3Provider.injectError(
        {
          code: 1234,
          message: 'Some bad chain error',
        },
        {debugName: 'ERRRRR1'}
      );

      await waitForValueToChange(() => result.current.amountContributedStatus);

      // Assert rejected
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(REJECTED);

      // Cleanup
      spy.mockRestore();
      (config as any).DEFAULT_CHAIN = originalDefaultChain;
    });
  });

  test('should not run if not mainnet', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useTotalAmountContributedMultisig(),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);

      await waitForNextUpdate();

      // Assert pending
      expect(result.current.amountContributed).toBe(0);
      expect(result.current.amountContributedStatus).toBe(STANDBY);
    });
  });
});
