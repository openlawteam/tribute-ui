import {renderHook, act} from '@testing-library/react-hooks';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../../test/restResponses';
import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../../adapters-extensions/enums';
import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {DEFAULT_DRAFT_HASH, DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {useProposals} from './useProposals';
import Wrapper from '../../../test/Wrapper';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {VotingState} from '../voting/types';
import {proposalHasVotingState} from '../helpers';

const mockWeb3Responses: Parameters<typeof Wrapper>[0]['getProps'] = ({
  mockWeb3Provider,
  web3Instance,
}) => {
  // Mock the proposals' multicall response
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [
          // For Draft
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
          // For Proposal 1
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
          // For Proposal 2
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

  /**
   * Mock results for `useProposalsVotingAdapter`
   */

  const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
    'address',
    DEFAULT_ETH_ADDRESS
  );
  const noVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
    'address',
    BURN_ADDRESS
  );
  const votingAdapterResponse = web3Instance.eth.abi.encodeParameter(
    'address',
    '0xa8ED02b24B4E9912e39337322885b65b23CdF188'
  );

  const offchainVotingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
    'string',
    VotingAdapterName.OffchainVotingContract
  );

  const votingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
    'string',
    VotingAdapterName.VotingContract
  );

  // Mock `dao.votingAdapter` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [
          // For Draft; not sponsored, yet.
          noVotingAdapterResponse,
          offchainVotingAdapterResponse,
          votingAdapterResponse,
        ],
      ]
    )
  );

  // Mock `IVoting.getAdapterName` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [
          // For Proposal 1
          offchainVotingAdapterNameResponse,
          // For Proposal 2
          votingAdapterNameResponse,
        ],
      ]
    )
  );

  /**
   * Mock results for `useProposalsVotingState`
   */

  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [
          // VotingState.IN_PROGRESS
          web3Instance.eth.abi.encodeParameter('uint8', '4'),
          // VotingState.IN_PROGRESS
          web3Instance.eth.abi.encodeParameter('uint8', '4'),
        ],
      ]
    )
  );
};

describe('useProposals unit tests', () => {
  test('should return correct hook state', async () => {
    const props = {adapterName: DaoAdapterConstants.ONBOARDING};

    const proposal1 = {
      // Proposal 1
      '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca70': {
        ...Object.values(snapshotAPIProposalResponse)[0],
        data: {
          authorIpfsHash:
            '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca70',
          erc712DraftHash:
            '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
        },
        authorIpfsHash:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca70',
      },
    };

    const proposal2 = {
      // Proposal 2
      '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca53': {
        ...Object.values(snapshotAPIProposalResponse)[0],
        data: {
          authorIpfsHash:
            '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca53',
          erc712DraftHash:
            '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
        },
        authorIpfsHash:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca53',
      },
    };

    // Return 1 Draft and 2 Proposals
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({...proposal1, ...proposal2}))
        ),
      ]
    );

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposals(props),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: mockWeb3Responses,
          },
        }
      );

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.proposalsStatus);

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      expect(result.current.proposalsStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposals.length).toBe(3);

      // Assert Draft

      expect(result.current.proposals[0].daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '1',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '1',
      });

      expect(result.current.proposals[0].idInDAO).toBe(DEFAULT_DRAFT_HASH);

      expect(result.current.proposals[0].snapshotType).toBe(SnapshotType.draft);

      expect(result.current.proposals[0].daoProposalVotingAdapter).toBe(
        undefined
      );

      expect(result.current.proposals[0].snapshotDraft).toMatchObject({
        ...Object.values(snapshotAPIDraftResponse)[0],
        idInDAO: DEFAULT_DRAFT_HASH,
        idInSnapshot: DEFAULT_DRAFT_HASH,
      });

      // Assert Proposal 1

      expect(result.current.proposals[1].daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(result.current.proposals[1].idInDAO).toBe(
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69'
      );

      expect(result.current.proposals[1].snapshotType).toBe(
        SnapshotType.proposal
      );

      expect(
        result.current.proposals[1].daoProposalVotingAdapter
          ?.getVotingAdapterABI
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[1].daoProposalVotingAdapter
          ?.getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[1].daoProposalVotingAdapter
          ?.votingAdapterAddress
      ).toBe(DEFAULT_ETH_ADDRESS);

      expect(
        result.current.proposals[1].daoProposalVotingAdapter?.votingAdapterName
      ).toBe(VotingAdapterName.OffchainVotingContract);

      await waitForValueToChange(
        () => result.current.proposals[1].daoProposalVotingState
      );

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[1].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[1].snapshotProposal).toMatchObject({
        ...Object.values(proposal1)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
      });

      // Assert Proposal 2

      expect(result.current.proposals[2].daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(result.current.proposals[2].idInDAO).toBe(
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52'
      );

      expect(result.current.proposals[2].snapshotType).toBe(
        SnapshotType.proposal
      );

      expect(
        result.current.proposals[2].daoProposalVotingAdapter
          ?.getVotingAdapterABI
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[2].daoProposalVotingAdapter
          ?.getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[2].daoProposalVotingAdapter
          ?.votingAdapterAddress
      ).toBe('0xa8ED02b24B4E9912e39337322885b65b23CdF188');

      expect(
        result.current.proposals[2].daoProposalVotingAdapter?.votingAdapterName
      ).toBe(VotingAdapterName.VotingContract);

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[2].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[2].snapshotProposal).toMatchObject({
        ...Object.values(proposal2)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
      });
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

      const {result, waitForValueToChange} = await renderHook(
        () => useProposals({adapterName: DaoAdapterConstants.ONBOARDING}),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            getProps: mockWeb3Responses,
          },
        }
      );

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.proposalsStatus);

      expect(result.current.proposals).toMatchObject([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      expect(result.current.proposalsStatus).toBe(AsyncStatus.REJECTED);

      await waitForValueToChange(() => result.current.proposalsError);

      expect(result.current.proposalsError?.message).toMatch(
        /something went wrong while fetching the/i
      );
      expect(result.current.proposals.length).toBe(0);
    });
  });
});
