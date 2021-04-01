import {renderHook, act} from '@testing-library/react-hooks';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../../test/restResponses';
import {AsyncStatus} from '../../../util/types';
import {DaoAdapterConstants} from '../../adapters-extensions/enums';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {useProposals} from './useProposals';
import Wrapper from '../../../test/Wrapper';

describe('useProposals unit tests', () => {
  test('should return correct hook state', async () => {
    await act(async () => {
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
            async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
          ),
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
            async (_req, res, ctx) => res(ctx.json(snapshotAPIProposalResponse))
          ),
        ]
      );

      const {result, waitForNextUpdate} = await renderHook(
        () => useProposals({adapterName: DaoAdapterConstants.ONBOARDING}),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              // Mock the proposals' multicall response
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
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposalsStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposals.length).toBe(2);

      expect(result.current.proposals[0].daoProposal).toMatchObject({
        '0': '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
        '1': '3',
        __length__: 2,
        adapterAddress: '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
        flags: '3',
      });

      expect(result.current.proposals[0].snapshotProposal).toMatchObject(
        Object.values(snapshotAPIProposalResponse)[0]
      );

      expect(result.current.proposals[1].daoProposal).toMatchObject({
        '0': '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
        '1': '1',
        __length__: 2,
        adapterAddress: '0x04028Df0Cea639E97fDD3fC01bA5CC172613211D',
        flags: '1',
      });

      expect(result.current.proposals[1].snapshotDraft).toMatchObject(
        Object.values(snapshotAPIDraftResponse)[0]
      );
    });
  });

  test('should return error', async () => {
    await act(async () => {
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
            async (_req, res, ctx) => res(ctx.status(500))
          ),
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
            async (_req, res, ctx) => res(ctx.status(500))
          ),
        ]
      );

      const {result, waitForNextUpdate} = await renderHook(
        () => useProposals({adapterName: DaoAdapterConstants.ONBOARDING}),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              // Mock the proposals' multicall response
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
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForNextUpdate();

      expect(result.current.proposalsStatus).toBe(AsyncStatus.REJECTED);
      expect(result.current.proposalsError?.message).toMatch(
        /something went wrong while fetching the/i
      );
      expect(result.current.proposals.length).toBe(0);
    });
  });
});
