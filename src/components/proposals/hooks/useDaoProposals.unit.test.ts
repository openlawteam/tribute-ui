import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {useDaoProposals} from './useDaoProposals';
import Wrapper from '../../../test/Wrapper';

describe('useDaoProposals unit tests', () => {
  test('should return correct data', async () => {
    const daoProposals = [
      '0xb595d47247c84a9950a3bdad149a9e4be471e11d11dbbab30d8fb6b7b9cce751',
      '0xbbc6d2f0954bd9c72110cd1ac33806386d9a5f13f2020e7b7c860d09737d1131',
    ];

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useDaoProposals(daoProposals),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
        }
      );

      // Assert initial
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );

      // Inject mocked result for `proposals`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                {
                  Proposal: {
                    adapterAddress: 'address',
                    flags: 'uint256',
                  },
                },
                {
                  adapterAddress: DEFAULT_ETH_ADDRESS,
                  // ProposalFlag.EXISTS
                  flags: '1',
                }
              ),
              web3Instance.eth.abi.encodeParameter(
                {
                  Proposal: {
                    adapterAddress: 'address',
                    flags: 'uint256',
                  },
                },
                {
                  adapterAddress: DEFAULT_ETH_ADDRESS,
                  // ProposalFlag.SPONSORED
                  flags: '3',
                }
              ),
            ],
          ]
        )
      );

      await waitForValueToChange(() => result.current.daoProposalsStatus);

      // Assert pending
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.PENDING
      );

      await waitForValueToChange(() => result.current.daoProposals);

      // Assert fulfilled
      expect(result.current.daoProposals).toEqual([
        [
          daoProposals[0],
          {
            '0': '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            '1': '1',
            __length__: 2,
            adapterAddress: '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            flags: '1',
          },
        ],
        [
          daoProposals[1],
          {
            '0': '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            '1': '3',
            __length__: 2,
            adapterAddress: '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            flags: '3',
          },
        ],
      ]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.FULFILLED
      );
    });
  });

  test('should return correct data when proposals empty', async () => {
    const daoProposals: string[] = [];

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useDaoProposals(daoProposals),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
          },
        }
      );

      // Assert initial
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      // Assert no change
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );
    });
  });

  test('should return correct data when some proposals have bad id', async () => {
    const daoProposals = [
      'bad id',
      '0xbbc6d2f0954bd9c72110cd1ac33806386d9a5f13f2020e7b7c860d09737d1131',
    ];

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useDaoProposals(daoProposals),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
        }
      );

      // Assert initial
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );

      // Inject mocked result for `proposals`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                {
                  Proposal: {
                    adapterAddress: 'address',
                    flags: 'uint256',
                  },
                },
                {
                  adapterAddress: DEFAULT_ETH_ADDRESS,
                  // ProposalFlag.SPONSORED
                  flags: '3',
                }
              ),
            ],
          ]
        )
      );

      await waitForValueToChange(() => result.current.daoProposalsStatus);

      // Assert pending
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.PENDING
      );

      await waitForValueToChange(() => result.current.daoProposals);

      // Assert fulfilled
      expect(result.current.daoProposals).toEqual([
        [
          daoProposals[1],
          {
            '0': '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            '1': '3',
            __length__: 2,
            adapterAddress: '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
            flags: '3',
          },
        ],
      ]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.FULFILLED
      );
    });
  });

  test('should return correct data when all proposals have bad id', async () => {
    const daoProposals = ['bad id', '123'];

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useDaoProposals(daoProposals),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
          },
        }
      );

      // Assert initial
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );

      await waitForValueToChange(() => result.current.daoProposalsStatus);

      // Assert fulfilled
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.FULFILLED
      );
    });
  });

  test('should return correct data on error', async () => {
    const daoProposals = [
      '0xb595d47247c84a9950a3bdad149a9e4be471e11d11dbbab30d8fb6b7b9cce751',
      '0xbbc6d2f0954bd9c72110cd1ac33806386d9a5f13f2020e7b7c860d09737d1131',
    ];

    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useDaoProposals(daoProposals),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
            },
          },
        }
      );

      // Assert initial
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.STANDBY
      );

      /**
       * Inject mocked error result for `proposals`
       *
       * @todo Fix needing `injectResult` to make test work.
       */

      mockWeb3Provider.injectResult(null);
      mockWeb3Provider.injectError({code: 1234, message: 'Some RPC error!'});

      await waitForValueToChange(() => result.current.daoProposalsStatus);

      // Assert pending
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toBe(undefined);
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.PENDING
      );

      await waitForValueToChange(() => result.current.daoProposalsStatus);

      // Assert rejected
      expect(result.current.daoProposals).toStrictEqual([]);
      expect(result.current.daoProposalsError).toStrictEqual({
        code: 1234,
        message: 'Some RPC error!',
      });
      expect(result.current.daoProposalsStatus).toStrictEqual(
        AsyncStatus.REJECTED
      );
    });
  });
});
