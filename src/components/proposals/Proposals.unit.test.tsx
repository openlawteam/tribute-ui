import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';
import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../test/restResponses';
import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../adapters-extensions/enums';
import {BURN_ADDRESS} from '../../util/constants';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import Proposals from './Proposals';
import Wrapper, {WrapperReturnProps} from '../../test/Wrapper';

describe('ProposalCard unit tests', () => {
  // Build our mock REST call responses for Snapshot Hub

  const defaultDraftBody = Object.values(snapshotAPIDraftResponse)[0];
  const draftsResponse: typeof snapshotAPIDraftResponse = {
    // Proposal 1
    '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111': {
      ...defaultDraftBody,
      msg: {
        ...defaultDraftBody.msg,
        payload: {
          ...defaultDraftBody.msg.payload,
          name: 'Another nice one',
        },
      },
    },
    // Proposal 2 (change a bit of the default)
    '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c2222': {
      ...defaultDraftBody,
      msg: {
        ...defaultDraftBody.msg,
        payload: {
          ...defaultDraftBody.msg.payload,
          name: 'Another great one',
        },
      },
    },
  };

  const defaultProposalVotes: SnapshotProposalResponseData['votes'] = [
    {
      [DEFAULT_ETH_ADDRESS]: {
        address: DEFAULT_ETH_ADDRESS,
        msg: {
          version: '0.2.0',
          timestamp: '1614264732',
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: SnapshotType.vote,
          payload: {
            choice: 1, // Yes
            proposalId:
              '0x1679cac3f54777f5d9c95efd83beff9f87ac55487311ecacd95827d267a15c4e',
            metadata: {
              memberAddress: DEFAULT_ETH_ADDRESS,
            },
          },
        },
        sig: '0xdbdbf122734b34ed5b10542551636e4250e98f443e35bf5d625f284fe54dcaf80c5bc44be04fefed1e9e5f25a7c13809a5266fcdbdcd0b94c885f2128544e79a1b',
        authorIpfsHash:
          '0xfe8f864ef475f60c7e01d5425df332199c5ae7ab712b8545f07433c68f06c644',
        relayerIpfsHash: '',
        actionId: '0xFCB86F90bd7b30cDB8A2c43FB15bf5B33A70Ea4f',
      },
    },
    {
      '0xc0437e11094275376defbe51dc6e04598403d276': {
        address: '0xc0437e11094275376defbe51dc6e04598403d276',
        msg: {
          version: '0.2.0',
          timestamp: '1614264732',
          token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
          type: SnapshotType.vote,
          payload: {
            choice: 2, // No
            proposalId:
              '0x1679cac3f54777f5d9c95efd83beff9f87ac55487311ecacd95827d267a15c4e',
            metadata: {
              memberAddress: '0xc0437e11094275376defbe51dc6e04598403d276',
            },
          },
        },
        sig: '0xdbdbf122734b34ed5b10542551636e4250e98f443e35bf5d625f284fe54dcaf80c5bc44be04fefed1e9e5f25a7c13809a5266fcdbdcd0b94c885f2128544e79a1b',
        authorIpfsHash:
          '0xfe8f864ef475f60c7e01d5425df332199c5ae7ab712b8545f07433c68f06c644',
        relayerIpfsHash: '',
        actionId: '0xFCB86F90bd7b30cDB8A2c43FB15bf5B33A70Ea4f',
      },
    },
  ];

  const defaultProposalBody = Object.values(snapshotAPIProposalResponse)[0];
  const proposalsResponse: typeof snapshotAPIProposalResponse = {
    // Proposal 3 (passed)
    '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333': {
      ...defaultProposalBody,
      msg: {
        ...defaultProposalBody.msg,
        payload: {
          ...defaultProposalBody.msg.payload,
          name: 'Another cool one',
        },
      },
      data: {
        erc712DraftHash:
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333',
        authorIpfsHash: '',
      },
      votes: defaultProposalVotes,
    },
    // Proposal 4 (failed)
    '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c4444': {
      ...defaultProposalBody,
      msg: {
        ...defaultProposalBody.msg,
        payload: {
          ...defaultProposalBody.msg.payload,
          name: 'Another rad one',
        },
      },
      data: {
        erc712DraftHash:
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c4444',
        authorIpfsHash: '',
      },
      votes: defaultProposalVotes,
    },
    // Proposal 5 (voting)
    '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c5555': {
      ...defaultProposalBody,
      msg: {
        ...defaultProposalBody.msg,
        payload: {
          ...defaultProposalBody.msg.payload,
          name: 'Another awesome one',
          start: Date.now() / 1000 - 86400,
          end: Date.now() / 1000 + 86400,
        },
      },
      data: {
        erc712DraftHash:
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c5555',
        authorIpfsHash: '',
      },
      votes: defaultProposalVotes,
    },
  };

  function injectDefaultWeb3Results({
    mockWeb3Provider,
    web3Instance,
  }: {
    mockWeb3Provider: FakeHttpProvider;
    web3Instance: Web3;
  }) {
    injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});

    /**
     * Mock `useProposals` proposals response
     */
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
                // ProposalFlag.PROCESSED
                flags: '7',
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
                // ProposalFlag.PROCESSED
                flags: '7',
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

    /**
     * Mock results for `useProposalsVotingAdapter`
     */

    const offchainVotingAdapterAddressResponse =
      web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS);
    const noVotingAdapterAddressResponse = web3Instance.eth.abi.encodeParameter(
      'address',
      BURN_ADDRESS
    );

    const offchainVotingAdapterNameResponse =
      web3Instance.eth.abi.encodeParameter(
        'string',
        VotingAdapterName.OffchainVotingContract
      );

    // Mock `dao.votingAdapter` responses
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            noVotingAdapterAddressResponse,
            noVotingAdapterAddressResponse,
            offchainVotingAdapterAddressResponse,
            offchainVotingAdapterAddressResponse,
            offchainVotingAdapterAddressResponse,
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
            offchainVotingAdapterNameResponse,
            offchainVotingAdapterNameResponse,
            offchainVotingAdapterNameResponse,
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
            // VotingState.PASS
            web3Instance.eth.abi.encodeParameter('uint8', '2'),
            // VotingState.NOT_PASS
            web3Instance.eth.abi.encodeParameter('uint8', '3'),
            // VotingState.IN_PROGRESS
            web3Instance.eth.abi.encodeParameter('uint8', '4'),
          ],
        ]
      )
    );

    /**
     * Mock results for `useProposalsVotes`
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

    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            offchainVotesDataResponse,
            offchainVotesDataResponse,
            offchainVotesDataResponse,
          ],
        ]
      )
    );

    injectDefaultVotingWeightResults({web3Instance, mockWeb3Provider});
  }

  /**
   * Inject DAO configuration values.
   *
   * In the case of `<Proposals />`, it uses the off-chain
   * voting voting and grace period values.
   */
  function injectDefaultDaoConfigurationResults({
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
            web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
            web3Instance.eth.abi.encodeParameter('uint256', '100000'),
          ],
        ]
      )
    );
  }

  /**
   * Inject voting results. The order should align with the order above of
   * fake responses for proposals that have been sponsored.
   */
  function injectDefaultVotingWeightResults({
    mockWeb3Provider,
    web3Instance,
  }: {
    mockWeb3Provider: FakeHttpProvider;
    web3Instance: Web3;
  }) {
    // Inject passed result
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // Total units
            web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
            // Units for "yes" voter
            web3Instance.eth.abi.encodeParameter('uint256', '200000'),
            // Units for "no" voter
            web3Instance.eth.abi.encodeParameter('uint256', '100000'),
          ],
        ]
      )
    );

    // Inject failed result
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // Total units
            web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
            // Units for "yes" voter
            web3Instance.eth.abi.encodeParameter('uint256', '200000'),
            // Units for "no" voter
            web3Instance.eth.abi.encodeParameter('uint256', '300000'),
          ],
        ]
      )
    );

    // Inject voting result
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // Total units
            web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
            // Units for "yes" voter
            web3Instance.eth.abi.encodeParameter('uint256', '100000'),
            // Units for "no" voter
            web3Instance.eth.abi.encodeParameter('uint256', '100000'),
          ],
        ]
      )
    );
  }

  test('should render adapter proposal cards', async () => {
    const spy = jest.fn();

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(draftsResponse))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(proposalsResponse))
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultWeb3Results({
        mockWeb3Provider,
        web3Instance,
      } as WrapperReturnProps);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^proposals$/i)).toBeInTheDocument();
      expect(screen.getByText(/^passed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^failed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^voting$/i)).toBeInTheDocument();

      // Proposal names
      expect(screen.getByText(/another nice one/i)).toBeInTheDocument();
      expect(screen.getByText(/another cool one/i)).toBeInTheDocument();
      expect(screen.getByText(/another great one/i)).toBeInTheDocument();
      expect(screen.getByText(/another rad one/i)).toBeInTheDocument();
      expect(screen.getByText(/another awesome one/i)).toBeInTheDocument();
    });

    // Click on a proposal
    userEvent.click(screen.getByText(/another nice one/i));

    // Expect correct proposal id to come through in function args
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe(
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111'
      );
    });
  });

  test('should render adapter proposal cards when `includeProposalsExistingOnlyOffchain={true}`', async () => {
    const spy = jest.fn();

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(draftsResponse))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(proposalsResponse))
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          includeProposalsExistingOnlyOffchain
          onProposalClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});

      /**
       * Mock `useProposals` proposals response
       */
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
                // Does not exist
                {
                  adapterAddress: BURN_ADDRESS,
                  flags: '0',
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

      const offchainVotingAdapterAddressResponse =
        web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS);
      const noVotingAdapterAddressResponse =
        web3Instance.eth.abi.encodeParameter('address', BURN_ADDRESS);

      const offchainVotingAdapterNameResponse =
        web3Instance.eth.abi.encodeParameter(
          'string',
          VotingAdapterName.OffchainVotingContract
        );

      // Mock `dao.votingAdapter` responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              noVotingAdapterAddressResponse,
              noVotingAdapterAddressResponse,
              offchainVotingAdapterAddressResponse,
              offchainVotingAdapterAddressResponse,
              offchainVotingAdapterAddressResponse,
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
              offchainVotingAdapterNameResponse,
              offchainVotingAdapterNameResponse,
              offchainVotingAdapterNameResponse,
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
              // VotingState.PASS
              web3Instance.eth.abi.encodeParameter('uint8', '2'),
              // VotingState.NOT_PASS
              web3Instance.eth.abi.encodeParameter('uint8', '3'),
              // VotingState.IN_PROGRESS
              web3Instance.eth.abi.encodeParameter('uint8', '4'),
            ],
          ]
        )
      );

      /**
       * Mock results for `useProposalsVotes`
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

      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              offchainVotesDataResponse,
              offchainVotesDataResponse,
              offchainVotesDataResponse,
            ],
          ]
        )
      );

      injectDefaultVotingWeightResults({web3Instance, mockWeb3Provider});
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^proposals$/i)).toBeInTheDocument();
      expect(screen.getByText(/^passed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^failed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^voting$/i)).toBeInTheDocument();

      // Proposal names
      expect(screen.getByText(/another nice one/i)).toBeInTheDocument();
      expect(screen.getByText(/another cool one/i)).toBeInTheDocument();
      expect(screen.getByText(/another great one/i)).toBeInTheDocument();
      expect(screen.getByText(/another rad one/i)).toBeInTheDocument();
      expect(screen.getByText(/another awesome one/i)).toBeInTheDocument();
    });

    // Click on a proposal
    userEvent.click(screen.getByText(/another nice one/i));

    // Expect correct proposal id to come through in function args
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe(
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111'
      );
    });
  });

  test('should render failed adapter proposal cards when no Snapshot votes on proposal, and result not submitted', async () => {
    const spy = jest.fn();

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) =>
            res(
              ctx.json({
                '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333':
                  {
                    ...defaultProposalBody,
                    msg: {
                      ...defaultProposalBody.msg,
                      payload: {
                        ...defaultProposalBody.msg.payload,
                        name: 'A proposal with no snapshot votes',
                      },
                    },
                    data: {
                      erc712DraftHash:
                        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333',
                      authorIpfsHash: '',
                    },
                    // Define empty votes
                    votes: [],
                  },
              })
            )
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});

      /**
       * Mock `useProposals` proposals response
       */
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

      /**
       * Mock results for `useProposalsVotingAdapter`
       */

      // Mock `dao.votingAdapter` responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              ),
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
              web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.OffchainVotingContract
              ),
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
              // VotingState.GRACE_PERIOD
              web3Instance.eth.abi.encodeParameter('uint8', '5'),
            ],
          ]
        )
      );

      /**
       * Mock results for `useProposalsVotes`
       */

      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                {
                  Voting: {
                    snapshot: 'uint256',
                    proposalHash: 'bytes32',
                    reporter: 'address',
                    resultRoot: 'bytes32',
                    nbVoters: 'uint256',
                    nbYes: 'uint256',
                    nbNo: 'uint256',
                    startingTime: 'uint256',
                    gracePeriodStartingTime: 'uint256',
                    isChallenged: 'bool',
                    fallbackVotesCount: 'uint256',
                  },
                },
                {
                  snapshot: '0',
                  proposalHash:
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                  reporter: BURN_ADDRESS,
                  resultRoot:
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                  nbVoters: '0',
                  nbYes: '0',
                  nbNo: '0',
                  startingTime: '0',
                  gracePeriodStartingTime: '0',
                  isChallenged: false,
                  fallbackVotesCount: '0',
                }
              ),
            ],
          ]
        )
      );

      // Inject voting result with no voters
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // Total units
              web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
            ],
          ]
        )
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^failed$/i)).toBeInTheDocument();

      // Proposal names
      expect(
        screen.getByText(/a proposal with no snapshot votes/i)
      ).toBeInTheDocument();
    });

    // Click on a proposal
    userEvent.click(screen.getByText(/a proposal with no snapshot votes/i));

    // Expect correct proposal id to come through in function args
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe(
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333'
      );
    });
  });

  test('should render failed adapter proposal cards when Snapshot majority vote fails on proposal, and result not submitted', async () => {
    const spy = jest.fn();

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) =>
            res(
              ctx.json({
                '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333':
                  {
                    ...defaultProposalBody,
                    msg: {
                      ...defaultProposalBody.msg,
                      payload: {
                        ...defaultProposalBody.msg.payload,
                        name: 'A proposal with failed majority snapshot votes',
                      },
                    },
                    data: {
                      erc712DraftHash:
                        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333',
                      authorIpfsHash: '',
                    },
                    votes: defaultProposalVotes,
                  },
              })
            )
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});

      /**
       * Mock `useProposals` proposals response
       */
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

      /**
       * Mock results for `useProposalsVotingAdapter`
       */

      // Mock `dao.votingAdapter` responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              ),
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
              web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.OffchainVotingContract
              ),
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
              // VotingState.GRACE_PERIOD
              web3Instance.eth.abi.encodeParameter('uint8', '5'),
            ],
          ]
        )
      );

      /**
       * Mock results for `useProposalsVotes`
       */

      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter(
                {
                  Voting: {
                    snapshot: 'uint256',
                    proposalHash: 'bytes32',
                    reporter: 'address',
                    resultRoot: 'bytes32',
                    nbVoters: 'uint256',
                    nbYes: 'uint256',
                    nbNo: 'uint256',
                    startingTime: 'uint256',
                    gracePeriodStartingTime: 'uint256',
                    isChallenged: 'bool',
                    fallbackVotesCount: 'uint256',
                  },
                },
                {
                  snapshot: '0',
                  proposalHash:
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                  reporter: BURN_ADDRESS,
                  resultRoot:
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                  nbVoters: '0',
                  nbYes: '0',
                  nbNo: '0',
                  startingTime: '0',
                  gracePeriodStartingTime: '0',
                  isChallenged: false,
                  fallbackVotesCount: '0',
                }
              ),
            ],
          ]
        )
      );

      // Inject failed voting result
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // Total units
              web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
              // Units for "yes" voter
              web3Instance.eth.abi.encodeParameter('uint256', '200000'),
              // Units for "no" voter
              web3Instance.eth.abi.encodeParameter('uint256', '300000'),
            ],
          ]
        )
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^failed$/i)).toBeInTheDocument();

      // Proposal names
      expect(
        screen.getByText(/a proposal with failed majority snapshot votes/i)
      ).toBeInTheDocument();
    });

    // Click on a proposal
    userEvent.click(
      screen.getByText(/a proposal with failed majority snapshot votes/i)
    );

    // Expect correct proposal id to come through in function args
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe(
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333'
      );
    });
  });

  test('should render only non-sponsored proposals (e.g. first proposals in DAO; not sponsored)', async () => {
    const spy = jest.fn();

    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(draftsResponse))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});

      /**
       * Mock the unsponsored proposals' multicall response
       */
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
                  // ProposalFlag.EXISTS
                  flags: '1',
                }
              ),
            ],
          ]
        )
      );

      // For `useProposalsVotes`
      const noVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
        'address',
        BURN_ADDRESS
      );

      // `useProposalsVotes`: Mock `dao.votingAdapter` responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [0, [noVotingAdapterResponse, noVotingAdapterResponse]]
        )
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^proposals$/i)).toBeInTheDocument();

      // Proposal names
      expect(screen.getByText(/another nice one/i)).toBeInTheDocument();
      expect(screen.getByText(/another great one/i)).toBeInTheDocument();
    });

    // Click on a proposal
    userEvent.click(screen.getByText(/another nice one/i));

    // Expect correct proposal id to come through in function args
    await waitFor(() => {
      expect(spy.mock.calls[0][0]).toBe(
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111'
      );
    });
  });

  test('should render no proposals text', async () => {
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

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          web3Instance = p.web3Instance;
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={() => {}}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/no proposals, yet!/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(() => screen.getByText(/^proposals$/i)).toThrow();
      expect(() => screen.getByText(/^passed$/i)).toThrow();
      expect(() => screen.getByText(/^failed$/i)).toThrow();
      expect(() => screen.getByText(/^voting$/i)).toThrow();

      // Proposal names
      expect(() => screen.getByText(/another nice one/i)).toThrow();
      expect(() => screen.getByText(/another cool one/i)).toThrow();
      expect(() => screen.getByText(/another great one/i)).toThrow();
      expect(() => screen.getByText(/another rad one/i)).toThrow();
      expect(() => screen.getByText(/another awesome one/i)).toThrow();
    });
  });

  test('should render error if a snapshot hub api call is bad', async () => {
    server.use(
      ...[
        // Return a 500 error
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(proposalsResponse))
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          web3Instance = p.web3Instance;
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={() => {}}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultDaoConfigurationResults({mockWeb3Provider, web3Instance});
    });

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong while getting the proposals/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /something went wrong while fetching the snapshot drafts/i
        )
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(() => screen.getByText(/^proposals$/i)).toThrow();
      expect(() => screen.getByText(/^passed$/i)).toThrow();
      expect(() => screen.getByText(/^failed$/i)).toThrow();
      expect(() => screen.getByText(/^voting$/i)).toThrow();

      // Proposal names
      expect(() => screen.getByText(/another nice one/i)).toThrow();
      expect(() => screen.getByText(/another cool one/i)).toThrow();
      expect(() => screen.getByText(/another great one/i)).toThrow();
      expect(() => screen.getByText(/another rad one/i)).toThrow();
      expect(() => screen.getByText(/another awesome one/i)).toThrow();
    });
  });

  test('should render custom proposal card', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/drafts/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(draftsResponse))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(proposalsResponse))
        ),
      ]
    );

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          renderProposalCard={({proposalData}) => (
            <div>
              <h2>{`custom card: ${
                proposalData.snapshotDraft?.msg.payload.name ||
                proposalData.snapshotProposal?.msg.payload.name
              }`}</h2>
            </div>
          )}
        />
      </Wrapper>
    );

    await waitFor(() => {
      injectDefaultWeb3Results({
        mockWeb3Provider,
        web3Instance,
      } as WrapperReturnProps);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/loading content/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^proposals$/i)).toBeInTheDocument();
      expect(screen.getByText(/^passed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^failed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^voting$/i)).toBeInTheDocument();

      // Proposal names
      expect(
        screen.getByText(/custom card: another nice one/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/custom card: another cool one/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/custom card: another great one/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/custom card: another rad one/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/custom card: another awesome one/i)
      ).toBeInTheDocument();
    });
  });
});
