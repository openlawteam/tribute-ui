import {AbiItem} from 'web3-utils/types';
import {act, renderHook} from '@testing-library/react-hooks';
import {VoteChoices, SnapshotType} from '@openlaw/snapshot-js-erc712';
import {waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../../test/helpers';
import {
  ProposalData,
  ProposalFlowStatus,
  SnapshotDraft,
  SnapshotProposal,
} from '../types';
import {BURN_ADDRESS} from '../../../util/constants';
import {proposalHasVotingState} from '../helpers';
import {useProposalWithOffchainVoteStatus} from '.';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import {VotingState} from '../voting/types';
import OffchainVotingABI from '../../../abis/OffchainVotingContract.json';
import Wrapper from '../../../test/Wrapper';

const nowSeconds = Date.now() / 1000;
const defaultVoteStartTime: number = nowSeconds - 5;
const defaultVoteEndTime: number = nowSeconds + 5;

const fakeSnapshotProposal: SnapshotProposal = {
  msg: {
    payload: {
      snapshot: 123,
      name: '',
      body: '',
      choices: [VoteChoices.Yes, VoteChoices.No],
      metadata: {},
      start: defaultVoteStartTime,
      end: defaultVoteEndTime,
    },
    version: '',
    timestamp: '',
    token: '',
    type: SnapshotType.proposal,
  },
  actionId: '',
  address: '',
  authorIpfsHash: '',
  data: {authorIpfsHash: ''},
  idInDAO: DEFAULT_PROPOSAL_HASH,
  idInSnapshot: DEFAULT_PROPOSAL_HASH,
  relayerIpfsHash: '',
  sig: '',
  votes: [],
};

const fakeSnapshotDraft: SnapshotDraft = {
  msg: {
    payload: {
      name: '',
      body: '',
      choices: [VoteChoices.Yes, VoteChoices.No],
      metadata: {},
    },
    version: '',
    timestamp: '',
    token: '',
    type: SnapshotType.draft,
  },
  actionId: '',
  address: '',
  authorIpfsHash: '',
  data: {authorIpfsHash: '', sponsored: false},
  idInDAO: DEFAULT_PROPOSAL_HASH,
  idInSnapshot: DEFAULT_PROPOSAL_HASH,
  relayerIpfsHash: '',
  sig: '',
};

const defaultVotesMock = [
  {
    Voting: {
      snapshot: 'uint256',
      reporter: 'address',
      resultRoot: 'bytes32',
      nbYes: 'uint256',
      nbNo: 'uint256',
      startingTime: 'uint256',
      gracePeriodStartingTime: 'uint256',
      isChallenged: 'bool',
      forceFailed: 'bool',
      fallbackVotesCount: 'uint256',
    },
  },
  {
    fallbackVotesCount: '0',
    gracePeriodStartingTime: '1617964640',
    isChallenged: false,
    forceFailed: false,
    nbNo: '0',
    nbYes: '1',
    reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
    resultRoot:
      '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
    snapshot: '8376297',
    startingTime: '1617878162',
  },
];

const defaultVotesResult = {
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
};

const defaultNoVotesMock = [
  {
    Voting: {
      snapshot: 'uint256',
      reporter: 'address',
      resultRoot: 'bytes32',
      nbYes: 'uint256',
      nbNo: 'uint256',
      startingTime: 'uint256',
      gracePeriodStartingTime: 'uint256',
      isChallenged: 'bool',
      forceFailed: 'bool',
      fallbackVotesCount: 'uint256',
    },
  },
  {
    snapshot: '0',
    reporter: BURN_ADDRESS,
    resultRoot:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    nbYes: '0',
    nbNo: '0',
    startingTime: '0',
    gracePeriodStartingTime: '0',
    isChallenged: false,
    forceFailed: false,
    fallbackVotesCount: '0',
  },
];

const defaultNoVotesResult = {
  '0': '0',
  '1': BURN_ADDRESS,
  '2': '0x0000000000000000000000000000000000000000000000000000000000000000',
  '3': '0',
  '4': '0',
  '5': '0',
  '6': '0',
  '7': false,
  '8': false,
  '9': '0',
  __length__: 10,
  snapshot: '0',
  reporter: BURN_ADDRESS,
  resultRoot:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  gracePeriodStartingTime: '0',
  nbNo: '0',
  nbYes: '0',
  startingTime: '0',
  isChallenged: false,
  forceFailed: false,
  fallbackVotesCount: '0',
};

describe('useProposalWithOffchainVoteStatus unit tests', () => {
  test('should return correct data from hook when status is `Submit`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: undefined,
      snapshotDraft: fakeSnapshotDraft,
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
                      web3Instance.eth.abi.encodeParameter(
                        {
                          Proposal: {
                            adapterAddress: 'address',
                            flags: 'uint256',
                          },
                        },
                        // Does not exit in DAO. Defaults to initial `address`, `uint8` values.
                        {
                          adapterAddress: BURN_ADDRESS,
                          flags: '0',
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

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.daoProposal);

      expect(result.current.daoProposal).toMatchObject({
        '0': BURN_ADDRESS,
        '1': '0',
        __length__: 2,
        adapterAddress: BURN_ADDRESS,
        flags: '0',
      });

      await waitForValueToChange(() => result.current.status);

      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(ProposalFlowStatus.Submit);
    });
  });

  test('should return correct data from hook when status is `Sponsor`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: undefined,
      snapshotDraft: fakeSnapshotDraft,
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.daoProposal);

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '1',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '1',
      });

      await waitForValueToChange(() => result.current.status);

      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(ProposalFlowStatus.Sponsor);
    });
  });

  test('should return correct data from hook when status is `OffchainVoting`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: fakeSnapshotProposal,
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultNoVotesMock[0],
                        defaultNoVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.IN_PROGRESS)
                      web3Instance.eth.abi.encodeParameter('uint8', '4'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(ProposalFlowStatus.OffchainVoting);

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(
        defaultNoVotesResult
      );
    });
  });

  test('should return correct data from hook when status is `OffchainVoting` and `useCountdownToCheckInVoting: true`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {...fakeSnapshotProposal, votes: [{}, {}]},
    };

    const args = {
      countdownVotingEndSeconds: defaultVoteEndTime,
      countdownVotingStartSeconds: defaultVoteStartTime,
      proposal: proposalData as ProposalData,
      useCountdownToCheckInVoting: true,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultNoVotesMock[0],
                        defaultNoVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.IN_PROGRESS)
                      web3Instance.eth.abi.encodeParameter('uint8', '4'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      // Wait for timer to update
      await waitForValueToChange(() => result.current.status, {timeout: 5000});

      expect(result.current.status).toBe(ProposalFlowStatus.OffchainVoting);

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.IN_PROGRESS,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(
        defaultNoVotesResult
      );
    });
  });

  test('should return correct data from hook when status is `OffchainVotingSubmitResult`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
        // Just need something here to make the test pass
        votes: [
          {
            DEFAULT_ETH_ADDRESS: {
              address: '',
              msg: {
                version: '',
                timestamp: '',
                token: '',
                type: SnapshotType.vote,
                payload: {
                  /**
                   * Index of the vote chosen, i.e 1 = Yes, 2 = No
                   */
                  choice: 1,
                  metadata: {
                    /**
                     * @see SnapshotVoteData
                     */
                    memberAddress: '',
                  },
                  proposalId: '',
                },
              },
              sig: '',
              authorIpfsHash: '',
              relayerIpfsHash: '',
              actionId: '',
            },
          },
        ],
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultNoVotesMock[0],
                        defaultNoVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.GRACE_PERIOD)
                      web3Instance.eth.abi.encodeParameter('uint8', '5'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(
        ProposalFlowStatus.OffchainVotingSubmitResult
      );

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.GRACE_PERIOD,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(
        defaultNoVotesResult
      );
    });
  });

  test('should return correct data from hook when status is `OffchainVotingGracePeriod`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultVotesMock[0],
                        defaultVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.GRACE_PERIOD)
                      web3Instance.eth.abi.encodeParameter('uint8', '5'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(
        ProposalFlowStatus.OffchainVotingGracePeriod
      );

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.GRACE_PERIOD,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(defaultVotesResult);
    });
  });

  test('should return correct data from hook when status is `Process`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultVotesMock[0],
                        defaultVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.PASS)
                      web3Instance.eth.abi.encodeParameter('uint8', '2'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(ProposalFlowStatus.Process);

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.PASS,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(defaultVotesResult);
    });
  });

  test('should return correct data from hook when status is `Completed`', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
    };

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
                      web3Instance.eth.abi.encodeParameter(
                        {
                          Proposal: {
                            adapterAddress: 'address',
                            flags: 'uint256',
                          },
                        },
                        {
                          adapterAddress: DEFAULT_ETH_ADDRESS,
                          // ProposalFlag.PROCESSED
                          flags: '7',
                        }
                      ),
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultVotesMock[0],
                        defaultVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.PASS)
                      web3Instance.eth.abi.encodeParameter('uint8', '2'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.daoProposal);

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '7',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '7',
      });

      expect(
        proposalHasVotingState(
          VotingState.PASS,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(defaultVotesResult);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(ProposalFlowStatus.Completed);
    });
  });

  // @note This test uses an adjusted Jest timeout
  test('should poll for data when proposal is not yet processed', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
      pollInterval: 2000,
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        // Set the `pollInterval` to be a bit quicker
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;

              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // For `proposals` call
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
                      // For `votes` call
                      web3Instance.eth.abi.encodeParameter(
                        defaultVotesMock[0],
                        defaultVotesMock[1]
                      ),
                      // For `voteResult` call (VotingState.GRACE_PERIOD)
                      web3Instance.eth.abi.encodeParameter('uint8', '5'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(
        ProposalFlowStatus.OffchainVotingGracePeriod
      );

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.GRACE_PERIOD,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(defaultVotesResult);

      // Update the mock Web3 result for after polling
      await waitFor(() => {
        mockWeb3Provider.injectResult(
          web3Instance.eth.abi.encodeParameters(
            ['uint256', 'bytes[]'],
            [
              0,
              [
                // For `proposals` call
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
                // For `votes` call
                web3Instance.eth.abi.encodeParameter(
                  defaultVotesMock[0],
                  defaultVotesMock[1]
                ),
                // For `voteResult` call (VotingState.PASS)
                web3Instance.eth.abi.encodeParameter('uint8', '2'),
              ],
            ]
          )
        );
      });

      await waitForValueToChange(() => result.current.status, {timeout: 6000});

      // After polling the `status` should change
      await waitFor(() => {
        expect(result.current.status).toBe(ProposalFlowStatus.Process);
      });
    });
  }, 6000);

  // @note This test uses an adjusted Jest timeout
  test('should stop polling for data when proposal processed', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
      pollInterval: 2000,
    };

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    function injectDefaultMulticallResult({
      mockWeb3Provider,
      web3Instance,
    }: {
      mockWeb3Provider: FakeHttpProvider;
      web3Instance: Web3;
    }) {
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `proposals` call
              web3Instance.eth.abi.encodeParameter(
                {
                  Proposal: {
                    adapterAddress: 'address',
                    flags: 'uint256',
                  },
                },
                {
                  adapterAddress: DEFAULT_ETH_ADDRESS,
                  // ProposalFlag.PROCESSED
                  flags: '7',
                }
              ),
              // For `votes` call
              web3Instance.eth.abi.encodeParameter(
                defaultVotesMock[0],
                defaultVotesMock[1]
              ),
              // For `voteResult` call (VotingState.PASS)
              web3Instance.eth.abi.encodeParameter('uint8', '2'),
            ],
          ]
        )
      );
    }

    const {result} = renderHook(
      // Set the `pollInterval` to be a bit quicker
      () => useProposalWithOffchainVoteStatus(args),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;

            injectDefaultMulticallResult({mockWeb3Provider, web3Instance});
          },
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      injectDefaultMulticallResult({mockWeb3Provider, web3Instance});

      // Mock multicall to keep track of calls during polling
      const helpersToMock = await import('../../web3/helpers/multicall');
      const spy = jest.spyOn(helpersToMock, 'multicall');

      await new Promise((r) => setTimeout(r, 5000));

      /**
       * We expect only 1 call as the proposal is processed
       */
      expect(spy.mock.calls.length).toBe(1);

      spy.mockRestore();
    });
  }, 6000);

  // @note This test uses an adjusted Jest timeout
  test('should stop polling when `stopPollingForStatus` called', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
      pollInterval: 2000,
    };

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    function injectDefaultMulticallResult({
      mockWeb3Provider,
      web3Instance,
    }: {
      mockWeb3Provider: FakeHttpProvider;
      web3Instance: Web3;
    }) {
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `proposals` call
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
              // For `votes` call
              web3Instance.eth.abi.encodeParameter(
                defaultVotesMock[0],
                defaultVotesMock[1]
              ),
              // For `voteResult` call (VotingState.TIE)
              web3Instance.eth.abi.encodeParameter('uint8', '1'),
            ],
          ]
        )
      );
    }

    const {result} = renderHook(
      // Set the `pollInterval` to be a bit quicker
      () => useProposalWithOffchainVoteStatus(args),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;

            injectDefaultMulticallResult({mockWeb3Provider, web3Instance});
          },
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      injectDefaultMulticallResult({mockWeb3Provider, web3Instance});

      // Mock multicall to keep track of calls during polling
      const helpersToMock = await import('../../web3/helpers/multicall');
      const spy = jest.spyOn(helpersToMock, 'multicall');

      // Wait to see how many times the spy is called
      await new Promise((r) => setTimeout(r, 3000));

      expect(spy.mock.calls.length).toBe(2);

      // Stop polling
      result.current.stopPollingForStatus();

      // Wait to see how many times the spy is called
      await new Promise((r) => setTimeout(r, 3000));

      // We expect the same amount as before, as we requested to stop polling.
      expect(spy.mock.calls.length).toBe(2);

      spy.mockRestore();
    });
  }, 10000);

  test('should return error when async call throws on initial fetch', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: undefined,
      snapshotDraft: fakeSnapshotDraft,
    };

    const args = {
      proposal: proposalData as ProposalData,
      pollInterval: 2000,
    };

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    const {result, waitForValueToChange} = renderHook(
      // Set the `pollInterval` to be a bit quicker
      () => useProposalWithOffchainVoteStatus(args),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);
      expect(result.current.proposalFlowStatusError).toBe(undefined);

      mockWeb3Provider.injectError({
        code: 1234,
        message: 'Some bad error.',
      });

      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `proposals` call
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

      await waitForValueToChange(() => result.current.proposalFlowStatusError);

      expect(result.current.proposalFlowStatusError?.message).toMatch(
        /some bad error\./i
      );
    });
  });

  // @note This test uses an adjusted Jest timeout
  test('should return error when async call throws during polling', async () => {
    const proposalData: Partial<ProposalData> = {
      daoProposalVotingAdapter: {
        votingAdapterAddress: DEFAULT_ETH_ADDRESS,
        votingAdapterName: VotingAdapterName.OffchainVotingContract,
        getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
        getWeb3VotingAdapterContract: () => undefined as any,
      },
      snapshotProposal: {
        ...fakeSnapshotProposal,
        msg: {
          ...fakeSnapshotProposal.msg,
          payload: {
            ...fakeSnapshotProposal.msg.payload,
            start: nowSeconds - 100,
            end: nowSeconds - 50,
          },
        },
      },
    };

    const args = {
      proposal: proposalData as ProposalData,
      pollInterval: 2000,
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        // Set the `pollInterval` to be a bit quicker
        () => useProposalWithOffchainVoteStatus(args),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
        }
      );

      // Assert initial state
      expect(result.current.daoProposal).toBe(undefined);
      expect(result.current.daoProposalVoteResult).toBe(undefined);
      expect(result.current.daoProposalVote).toBe(undefined);
      expect(result.current.status).toBe(undefined);

      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `proposals` call
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
              // For `votes` call
              web3Instance.eth.abi.encodeParameter(
                defaultVotesMock[0],
                defaultVotesMock[1]
              ),
              // For `voteResult` call (VotingState.GRACE_PERIOD)
              web3Instance.eth.abi.encodeParameter('uint8', '5'),
            ],
          ]
        )
      );

      await waitForValueToChange(() => result.current.status);

      expect(result.current.status).toBe(
        ProposalFlowStatus.OffchainVotingGracePeriod
      );

      expect(result.current.daoProposal).toMatchObject({
        '0': DEFAULT_ETH_ADDRESS,
        '1': '3',
        __length__: 2,
        adapterAddress: DEFAULT_ETH_ADDRESS,
        flags: '3',
      });

      expect(
        proposalHasVotingState(
          VotingState.GRACE_PERIOD,
          result.current.daoProposalVoteResult || ''
        )
      ).toBe(true);

      expect(result.current.daoProposalVote).toMatchObject(defaultVotesResult);

      // Update the mock Web3 result for after polling
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `proposals` call
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
              // For `votes` call
              web3Instance.eth.abi.encodeParameter(
                defaultVotesMock[0],
                defaultVotesMock[1]
              ),
              // For `voteResult` call (VotingState.PASS)
              web3Instance.eth.abi.encodeParameter('uint8', '2'),
            ],
          ]
        )
      );

      mockWeb3Provider.injectError({
        code: 1234,
        message: 'Some bad error.',
      });

      await waitForValueToChange(() => result.current.proposalFlowStatusError, {
        timeout: 6000,
      });

      expect(result.current.proposalFlowStatusError?.message).toMatch(
        /some bad error\./i
      );
    });
  }, 6000);
});
