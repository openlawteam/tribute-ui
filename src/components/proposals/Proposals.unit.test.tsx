import {render, screen, waitFor} from '@testing-library/react';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../test/restResponses';
import {DaoAdapterConstants} from '../adapters-extensions/enums';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import Proposals from './Proposals';
import Wrapper from '../../test/Wrapper';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

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

  // @note Just to throw something we purposefully do not mock the multicall responses
  test('should render error', async () => {
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
