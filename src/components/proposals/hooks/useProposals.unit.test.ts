import {renderHook, act} from '@testing-library/react-hooks';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

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
  DEFAULT_PROPOSAL_HASH,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {proposalHasVotingState} from '../helpers';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {useProposals} from './useProposals';
import {VotingState} from '../voting/types';
import Wrapper from '../../../test/Wrapper';

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
        proposalHash: 'bytes32',
        reporter: 'address',
        resultRoot: 'bytes32',
        nbYes: 'uint256',
        nbNo: 'uint256',
        index: 'uint256',
        startingTime: 'uint256',
        gracePeriodStartingTime: 'uint256',
        isChallenged: 'bool',
        fallbackVotesCount: 'uint256',
      },
    },
    {
      snapshot: '8376297',
      proposalHash: DEFAULT_PROPOSAL_HASH,
      reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
      resultRoot:
        '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
      nbYes: '1',
      nbNo: '0',
      index: '0',
      startingTime: '1617878162',
      gracePeriodStartingTime: '1617964640',
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

      await waitForValueToChange(
        () => result.current.proposals[1].daoProposalVotingAdapter
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

      await waitForValueToChange(
        () => result.current.proposals[1].daoProposalVotes
      );

      expect(result.current.proposals[1].daoProposalVotes).toMatchObject({
        OffchainVotingContract: {
          '0': '8376297',
          '1': DEFAULT_PROPOSAL_HASH,
          '10': '0',
          '2': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          '3':
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          '4': '1',
          '5': '0',
          '6': '0',
          '7': '1617878162',
          '8': '1617964640',
          '9': false,
          __length__: 11,
          fallbackVotesCount: '0',
          gracePeriodStartingTime: '1617964640',
          index: '0',
          isChallenged: false,
          nbNo: '0',
          nbYes: '1',
          proposalHash: DEFAULT_PROPOSAL_HASH,
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          snapshot: '8376297',
          startingTime: '1617878162',
        },
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

      expect(result.current.proposals[2].daoProposalVotes).toMatchObject({
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

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposals(props),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            // We use different mocked results than the defaults
            getProps: ({mockWeb3Provider, web3Instance}) => {
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
                    proposalHash: 'bytes32',
                    reporter: 'address',
                    resultRoot: 'bytes32',
                    nbYes: 'uint256',
                    nbNo: 'uint256',
                    index: 'uint256',
                    startingTime: 'uint256',
                    gracePeriodStartingTime: 'uint256',
                    isChallenged: 'bool',
                    fallbackVotesCount: 'uint256',
                  },
                },
                {
                  snapshot: '8376297',
                  proposalHash: DEFAULT_PROPOSAL_HASH,
                  reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
                  resultRoot:
                    '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
                  nbYes: '1',
                  nbNo: '0',
                  index: '0',
                  startingTime: '1617878162',
                  gracePeriodStartingTime: '1617964640',
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
            },
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

      await waitForValueToChange(
        () => result.current.proposals[1].daoProposalVotingAdapter
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

      await waitForValueToChange(
        () => result.current.proposals[1].daoProposalVotes
      );

      expect(result.current.proposals[1].daoProposalVotes).toMatchObject({
        OffchainVotingContract: {
          '0': '8376297',
          '1': DEFAULT_PROPOSAL_HASH,
          '10': '0',
          '2': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          '3':
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          '4': '1',
          '5': '0',
          '6': '0',
          '7': '1617878162',
          '8': '1617964640',
          '9': false,
          __length__: 11,
          fallbackVotesCount: '0',
          gracePeriodStartingTime: '1617964640',
          index: '0',
          isChallenged: false,
          nbNo: '0',
          nbYes: '1',
          proposalHash: DEFAULT_PROPOSAL_HASH,
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          snapshot: '8376297',
          startingTime: '1617878162',
        },
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

      expect(result.current.proposals[2].daoProposalVotes).toMatchObject({
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

  test('should return correct hook state if `includeProposalsExistingOnlyOffchain` is not defined or `false`', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
      includeProposalsExistingOnlyOffchain: false,
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

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposals(props),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
            // We use different mocked results than the defaults
            getProps: ({mockWeb3Provider, web3Instance}) => {
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

              const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
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
                  [0, [offchainVotingAdapterResponse, votingAdapterResponse]]
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
                    proposalHash: 'bytes32',
                    reporter: 'address',
                    resultRoot: 'bytes32',
                    nbYes: 'uint256',
                    nbNo: 'uint256',
                    index: 'uint256',
                    startingTime: 'uint256',
                    gracePeriodStartingTime: 'uint256',
                    isChallenged: 'bool',
                    fallbackVotesCount: 'uint256',
                  },
                },
                {
                  snapshot: '8376297',
                  proposalHash: DEFAULT_PROPOSAL_HASH,
                  reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
                  resultRoot:
                    '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
                  nbYes: '1',
                  nbNo: '0',
                  index: '0',
                  startingTime: '1617878162',
                  gracePeriodStartingTime: '1617964640',
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
            },
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
      expect(result.current.proposals.length).toBe(2);

      // Assert Proposal 1

      expect(result.current.proposals[0].daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(result.current.proposals[0].idInDAO).toBe(
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69'
      );

      expect(result.current.proposals[0].snapshotType).toBe(
        SnapshotType.proposal
      );

      await waitForValueToChange(
        () => result.current.proposals[0].daoProposalVotingAdapter
      );

      expect(
        result.current.proposals[0].daoProposalVotingAdapter
          ?.getVotingAdapterABI
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[0].daoProposalVotingAdapter
          ?.getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);
      expect(
        result.current.proposals[0].daoProposalVotingAdapter
          ?.votingAdapterAddress
      ).toBe(DEFAULT_ETH_ADDRESS);

      expect(
        result.current.proposals[0].daoProposalVotingAdapter?.votingAdapterName
      ).toBe(VotingAdapterName.OffchainVotingContract);

      await waitForValueToChange(
        () => result.current.proposals[0].daoProposalVotingState
      );

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[0].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[0].snapshotProposal).toMatchObject({
        ...Object.values(proposal1)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca69',
      });

      await waitForValueToChange(
        () => result.current.proposals[0].daoProposalVotes
      );

      expect(result.current.proposals[0].daoProposalVotes).toMatchObject({
        OffchainVotingContract: {
          '0': '8376297',
          '1': DEFAULT_PROPOSAL_HASH,
          '10': '0',
          '2': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          '3':
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          '4': '1',
          '5': '0',
          '6': '0',
          '7': '1617878162',
          '8': '1617964640',
          '9': false,
          __length__: 11,
          fallbackVotesCount: '0',
          gracePeriodStartingTime: '1617964640',
          index: '0',
          isChallenged: false,
          nbNo: '0',
          nbYes: '1',
          proposalHash: DEFAULT_PROPOSAL_HASH,
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          snapshot: '8376297',
          startingTime: '1617878162',
        },
      });

      // Assert Proposal 2

      expect(result.current.proposals[1].daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(result.current.proposals[1].idInDAO).toBe(
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52'
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
      ).toBe('0xa8ED02b24B4E9912e39337322885b65b23CdF188');

      expect(
        result.current.proposals[1].daoProposalVotingAdapter?.votingAdapterName
      ).toBe(VotingAdapterName.VotingContract);

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.proposals[1].daoProposalVotingState || ''
        )
      ).toBe(true);

      expect(result.current.proposals[1].snapshotProposal).toMatchObject({
        ...Object.values(proposal2)[0],
        idInDAO:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
        idInSnapshot:
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca52',
      });

      expect(result.current.proposals[1].daoProposalVotes).toMatchObject({
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

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposals(props),
        {
          wrapper: Wrapper,
          initialProps: {
            useWallet: true,
            useInit: true,
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
      expect(result.current.proposals.length).toBe(0);
    });
  });

  test('should return error', async () => {
    const props: Parameters<typeof useProposals>[0] = {
      adapterName: DaoAdapterConstants.ONBOARDING,
    };

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

      expect(result.current.proposalsStatus).toBe(AsyncStatus.REJECTED);

      await waitForValueToChange(() => result.current.proposalsError);

      expect(result.current.proposalsError?.message).toMatch(
        /something went wrong while fetching the/i
      );
      expect(result.current.proposals.length).toBe(0);
    });
  });
});
