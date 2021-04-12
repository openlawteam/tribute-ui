import {render, screen, waitFor} from '@testing-library/react';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../test/restResponses';
import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../adapters-extensions/enums';
import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../test/helpers';
import {BURN_ADDRESS} from '../../util/constants';
import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import Proposals from './Proposals';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';
import Wrapper from '../../test/Wrapper';

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

  const defaultProposalBody = Object.values(snapshotAPIProposalResponse)[0];
  const proposalsResponse: typeof snapshotAPIProposalResponse = {
    // Proposal 3
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
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3434',
        authorIpfsHash: '',
      },
    },
    // Proposal 4
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
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c4545',
        authorIpfsHash: '',
      },
    },
    // Proposal 5
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
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c5656',
        authorIpfsHash: '',
      },
    },
  };

  const getWeb3Results = ({
    mockWeb3Provider,
    web3Instance,
  }: {
    mockWeb3Provider: FakeHttpProvider;
    web3Instance: Web3;
  }) => {
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

    // Mock proposals' voting state multicall response
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // VotingState.NOT_STARTED
            web3Instance.eth.abi.encodeParameter('uint8', '0'),
            // VotingState.NOT_STARTED
            web3Instance.eth.abi.encodeParameter('uint8', '0'),
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

    // For `useProposalsVotes`
    const noVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
      'address',
      BURN_ADDRESS
    );

    // For `useProposalsVotes`
    const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
      'address',
      DEFAULT_ETH_ADDRESS
    );

    // For `useProposalsVotes`
    const offchainVotingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
      'string',
      VotingAdapterName.OffchainVotingContract
    );

    /**
     * For `useProposalsVotes`
     *
     * @note Maintain the same order as the contract's struct.
     */
    const offchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
      {
        Voting: {
          snapshot: 'uint256',
          proposalHash: 'bytes32',
          reporter: 'address',
          resultRoot: 'bytes32',
          nbVoters: 'uint256',
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
        nbVoters: '0',
        nbYes: '1',
        nbNo: '0',
        index: '0',
        startingTime: '1617878162',
        gracePeriodStartingTime: '1617964640',
        isChallenged: false,
        fallbackVotesCount: '0',
      }
    );

    // `useProposalsVotes`: Mock `dao.votingAdapter` responses
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            noVotingAdapterResponse,
            noVotingAdapterResponse,
            offchainVotingAdapterResponse,
            offchainVotingAdapterResponse,
            offchainVotingAdapterResponse,
          ],
        ]
      )
    );

    // `useProposalsVotes`: Mock `IVoting.getAdapterName` responses
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

    // `useProposalsVotes`: Mock votes data responses
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
  };

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

    render(
      <Wrapper useInit useWallet getProps={getWeb3Results}>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={spy}
        />
      </Wrapper>
    );

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

    render(
      <Wrapper useInit useWallet>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={() => {}}
        />
      </Wrapper>
    );

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

    render(
      <Wrapper useInit useWallet>
        <Proposals
          adapterName={DaoAdapterConstants.ONBOARDING}
          onProposalClick={() => {}}
        />
      </Wrapper>
    );

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

    render(
      <Wrapper useInit useWallet getProps={getWeb3Results}>
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
