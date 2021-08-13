import {renderHook, act} from '@testing-library/react-hooks';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../../test/restResponses';
import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../../adapters-extensions/enums';
import {
  DEFAULT_DRAFT_HASH,
  DEFAULT_ETH_ADDRESS,
  FakeHttpProvider,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {proposalHasVotingState} from '../helpers';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {useProposals} from './useProposals';
import {VotingState} from '../voting/types';
import Wrapper, {WrapperReturnProps} from '../../../test/Wrapper';

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

  const offchainVotingAdapterNameResponse =
    web3Instance.eth.abi.encodeParameter(
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

  /**
   * Mock results for `useProposalsVotes`
   *
   * @note Maintain the same order as the contract's struct.
   * @note We use the same, single result for any off-chain votes repsonses for testing only.
   */
  const offchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
    {
      Voting: {
        snapshot: 'uint256',
        reporter: 'address',
        resultRoot: 'bytes32',
        nbYes: 'uint256',
        nbNo: 'uint256',
        startingTime: 'uint256',
        gracePeriodStartingTime: 'uint256',
        forceFailed: 'bool',
        isChallenged: 'bool',
        fallbackVotesCount: 'uint256',
      },
    },
    {
      snapshot: '8376297',
      reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
      resultRoot:
        '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
      nbYes: '1',
      nbNo: '0',
      startingTime: '1617878162',
      gracePeriodStartingTime: '1617964640',
      forceFailed: false,
      isChallenged: false,
      fallbackVotesCount: '0',
    }
  );

  /**
   * @note Maintain the same order as the contract's struct.
   */
  const onchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
    {
      Voting: {
        nbYes: 'uint256',
        nbNo: 'uint256',
        startingTime: 'uint256',
        blockNumber: 'uint256',
      },
    },
    {
      blockNumber: '10',
      nbNo: '50',
      nbYes: '100',
      startingTime: '1617878162',
    }
  );

  // Mock votes data responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [0, [offchainVotesDataResponse, onchainVotesDataResponse]]
    )
  );
};

describe('useProposals unit tests', () => {
  test('should return correct hook state', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
    };

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

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useProposals(props),
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

    await act(async () => {
      mockWeb3Responses({mockWeb3Provider, web3Instance} as WrapperReturnProps);

      // Assert initial state
      expect(result.current.proposals).toStrictEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert pending state
      expect(result.current.proposals).toStrictEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert fulfilled state
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.FULFILLED);

      // Assert Draft

      expect(result.current.proposals[0].daoProposal).toEqual({
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

      expect(result.current.proposals[0].snapshotDraft).toEqual({
        ...Object.values(snapshotAPIDraftResponse)[0],
        idInDAO: DEFAULT_DRAFT_HASH,
        idInSnapshot: DEFAULT_DRAFT_HASH,
      });

      // Assert Proposal 1

      expect(result.current.proposals[1].daoProposal).toEqual({
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

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[1].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[1].snapshotProposal).toEqual({
        ...Object.values(proposal1)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
      });

      expect(result.current.proposals[1].daoProposalVote).toEqual({
        OffchainVotingContract: {
          '0': '8376297',
          '1': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          '2': '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          '3': '1',
          '4': '0',
          '5': '1617878162',
          '6': '1617964640',
          '7': false,
          '8': false,
          '9': '0',
          __length__: 10,
          snapshot: '8376297',
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          nbYes: '1',
          nbNo: '0',
          startingTime: '1617878162',
          gracePeriodStartingTime: '1617964640',
          forceFailed: false,
          isChallenged: false,
          fallbackVotesCount: '0',
        },
      });

      // Assert Proposal 2

      expect(result.current.proposals[2].daoProposal).toEqual({
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

      expect(result.current.proposals[2].snapshotProposal).toEqual({
        ...Object.values(proposal2)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
      });

      expect(result.current.proposals[2].daoProposalVote).toEqual({
        VotingContract: {
          '0': '100',
          '1': '50',
          '2': '1617878162',
          '3': '10',
          __length__: 4,
          blockNumber: '10',
          nbNo: '50',
          nbYes: '100',
          startingTime: '1617878162',
        },
      });
    });
  });

  test('should return correct hook state if `includeProposalsExistingOnlyOffchain={true}`', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
      includeProposalsExistingOnlyOffchain: true,
    };

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

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useProposals(props),
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

    await act(async () => {
      // Assert initial state
      expect(result.current.proposals).toEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      // Mock the proposals' multicall response. We use different mocked results than the defaults.
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
                  // Does not exit in DAO. Defaults to initial `address`, `uint8` values.
                  adapterAddress: BURN_ADDRESS,
                  flags: '0',
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

      const offchainVotingAdapterResponse =
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS);
      const noVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
        'address',
        BURN_ADDRESS
      );
      const votingAdapterResponse = web3Instance.eth.abi.encodeParameter(
        'address',
        '0xa8ED02b24B4E9912e39337322885b65b23CdF188'
      );

      const offchainVotingAdapterNameResponse =
        web3Instance.eth.abi.encodeParameter(
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

      /**
       * Mock results for `useProposalsVotes`
       *
       * @note Maintain the same order as the contract's struct.
       * @note We use the same, single result for any off-chain votes repsonses for testing only.
       */
      const offchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
        {
          Voting: {
            snapshot: 'uint256',
            reporter: 'address',
            resultRoot: 'bytes32',
            nbYes: 'uint256',
            nbNo: 'uint256',
            startingTime: 'uint256',
            gracePeriodStartingTime: 'uint256',
            forceFailed: 'bool',
            isChallenged: 'bool',
            fallbackVotesCount: 'uint256',
          },
        },
        {
          snapshot: '8376297',
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          nbYes: '1',
          nbNo: '0',
          startingTime: '1617878162',
          gracePeriodStartingTime: '1617964640',
          forceFailed: false,
          isChallenged: false,
          fallbackVotesCount: '0',
        }
      );

      /**
       * @note Maintain the same order as the contract's struct.
       */
      const onchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
        {
          Voting: {
            nbYes: 'uint256',
            nbNo: 'uint256',
            startingTime: 'uint256',
            blockNumber: 'uint256',
          },
        },
        {
          blockNumber: '10',
          nbNo: '50',
          nbYes: '100',
          startingTime: '1617878162',
        }
      );

      // Mock votes data responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [0, [offchainVotesDataResponse, onchainVotesDataResponse]]
        )
      );

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert pending state
      expect(result.current.proposals).toStrictEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert fulfilled state
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.FULFILLED);

      // Assert Draft

      expect(result.current.proposals[0].daoProposal).toEqual({
        '0': BURN_ADDRESS,
        '1': '0',
        __length__: 2,
        adapterAddress: BURN_ADDRESS,
        flags: '0',
      });

      expect(result.current.proposals[0].idInDAO).toBe(DEFAULT_DRAFT_HASH);

      expect(result.current.proposals[0].snapshotType).toBe(SnapshotType.draft);

      expect(result.current.proposals[0].daoProposalVotingAdapter).toBe(
        undefined
      );

      expect(result.current.proposals[0].snapshotDraft).toEqual({
        ...Object.values(snapshotAPIDraftResponse)[0],
        idInDAO: DEFAULT_DRAFT_HASH,
        idInSnapshot: DEFAULT_DRAFT_HASH,
      });

      // Assert Proposal 1

      expect(result.current.proposals[1].daoProposal).toEqual({
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

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[1].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[1].snapshotProposal).toEqual({
        ...Object.values(proposal1)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
      });

      expect(result.current.proposals[1].daoProposalVote).toEqual({
        OffchainVotingContract: {
          '0': '8376297',
          '1': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          '2': '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          '3': '1',
          '4': '0',
          '5': '1617878162',
          '6': '1617964640',
          '7': false,
          '8': false,
          '9': '0',
          __length__: 10,
          snapshot: '8376297',
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          nbYes: '1',
          nbNo: '0',
          startingTime: '1617878162',
          gracePeriodStartingTime: '1617964640',
          forceFailed: false,
          isChallenged: false,
          fallbackVotesCount: '0',
        },
      });

      // Assert Proposal 2

      expect(result.current.proposals[2].daoProposal).toEqual({
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

      expect(result.current.proposals[2].snapshotProposal).toEqual({
        ...Object.values(proposal2)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
      });

      expect(result.current.proposals[2].daoProposalVote).toEqual({
        VotingContract: {
          '0': '100',
          '1': '50',
          '2': '1617878162',
          '3': '10',
          __length__: 4,
          blockNumber: '10',
          nbNo: '50',
          nbYes: '100',
          startingTime: '1617878162',
        },
      });
    });
  });

  test('should return correct hook state if no proposals returned from Snapshot Hub', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
    };

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
      ]
    );

    const {result, waitForValueToChange} = renderHook(
      () => useProposals(props),
      {
        wrapper: Wrapper,
        initialProps: {
          useWallet: true,
          useInit: true,
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.proposals).toEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert pending state
      expect(result.current.proposals).toEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert fulfilled state
      expect(result.current.proposalsStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposals.length).toBe(0);
    });
  });

  test('should return error if Snapshot Hub server error', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
    };

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

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useProposals(props),
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

    await act(async () => {
      // Assert initial state
      expect(result.current.proposals).toEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.STANDBY);

      mockWeb3Responses({mockWeb3Provider, web3Instance} as WrapperReturnProps);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert pending state
      expect(result.current.proposals).toEqual([]);
      expect(result.current.proposalsError).toBe(undefined);
      expect(result.current.proposalsStatus).toBe(AsyncStatus.PENDING);

      await waitForValueToChange(() => result.current.proposalsStatus);

      // Assert rejected state
      expect(result.current.proposalsStatus).toBe(AsyncStatus.REJECTED);

      expect(result.current.proposalsError?.message).toMatch(
        /something went wrong while fetching the/i
      );
      expect(result.current.proposals.length).toBe(0);
    });
  });
});
