import {render, screen, waitFor} from '@testing-library/react';
import {SnapshotType, VoteChoices} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {OffchainVotingStatus} from './OffchainVotingStatus';
import {ProposalData} from '../types';
import Wrapper from '../../../test/Wrapper';

describe('OffchainVotingStatus unit tests', () => {
  const nowSeconds = () => Date.now() / 1000;
  const approvedRegex: RegExp = /approved/i;
  const votingEndsRegex: RegExp = /^ends:/i;
  const gracePeriodEndedRegex: RegExp = /grace period ended/i;
  const gracePeriodEndsRegex: RegExp = /grace period ends/i;
  const loadingRegex: RegExp = /getting off-chain voting status/i;

  // Bare minimum fake data
  const fakeProposal: () => Partial<ProposalData> = () => ({
    snapshotDraft: undefined,
    snapshotProposal: {
      idInSnapshot: 'abc123',
      idInDAO: 'abc123',
      msg: {
        payload: {
          name: 'Such a great proposal',
          body: '',
          choices: [VoteChoices.Yes, VoteChoices.No],
          start: nowSeconds(),
          end: nowSeconds() + 3,
          snapshot: 100,
        },
        type: SnapshotType.proposal,
      },
      // A single "yes" vote
      votes: [
        {
          DEFAULT_ETH_ADDRESS: {
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
      ],
    } as any,
  });

  function mockWeb3VoteResults({
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

  test('should render correct content', async () => {
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
        <OffchainVotingStatus proposal={fakeProposal() as ProposalData} />
      </Wrapper>
    );

    await waitFor(() => {
      mockWeb3VoteResults({mockWeb3Provider, web3Instance});
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: approved
    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });
  });

  test('should render correct content when providing a "votingResult"', async () => {
    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          proposal={fakeProposal() as ProposalData}
          votingResult={{
            Yes: {units: 100000, percentage: 1},
            No: {units: 0, percentage: 0},
            totalUnits: 10000000,
          }}
        />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: approved
    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });
  });

  test('should render correct content when voting period provided', async () => {
    const timeNowMs: number = Date.now();

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
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 3000}
          proposal={fakeProposal() as ProposalData}
        />
      </Wrapper>
    );

    // Inject mocked results for total units and single vote
    await waitFor(() => {
      mockWeb3VoteResults({mockWeb3Provider, web3Instance});
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status
    await waitFor(
      () => {
        expect(screen.getByText(approvedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(loadingRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  });

  test('should render correct content when grace period props provided', async () => {
    const timeNowMs: number = Date.now();
    const proposal = fakeProposal() as ProposalData;

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    const {rerender} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          web3Instance = p.web3Instance;
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <OffchainVotingStatus
          countdownGracePeriodStartMs={timeNowMs}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Inject mocked results for total units and single vote
    await waitFor(() => {
      mockWeb3VoteResults({mockWeb3Provider, web3Instance});
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownGracePeriodStartMs={timeNowMs}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          renderStatus={({
            gracePeriodStartEndInitReady,
            hasGracePeriodEnded,
            hasGracePeriodStarted,
          }) => {
            if (
              gracePeriodStartEndInitReady &&
              hasGracePeriodStarted &&
              hasGracePeriodEnded
            ) {
              return (
                <span>
                  Grace period ended <br />{' '}
                  <span style={{textTransform: 'none'}}>
                    Awaiting contract status&hellip;
                  </span>
                </span>
              );
            }
          }}
        />
      </Wrapper>
    );

    // Grace period ended label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodEndedRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );

    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownGracePeriodStartMs={timeNowMs}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          // Re-render without a custom status (i.e. contract status says we are no longer in grace period)
          renderStatus={() => {
            return null;
          }}
        />
      </Wrapper>
    );

    // Assert vote approved
    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByLabelText(loadingRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });
  }, 10000);

  test('should render correct content when voting period and grace period provided', async () => {
    const timeNowMs: number = Date.now();
    const proposal = fakeProposal() as ProposalData;

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
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 4000}
          countdownGracePeriodStartMs={timeNowMs + 5000}
          countdownGracePeriodEndMs={timeNowMs + 8000}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Inject mocked results for total units and single vote
    await waitFor(() => {
      mockWeb3VoteResults({mockWeb3Provider, web3Instance});
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
      },
      {timeout: 10000}
    );

    // Assert vote approved (grace period is finished)
    await waitFor(
      () => {
        expect(screen.getByText(approvedRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  test('should render correct content when `renderStatus` provided', async () => {
    const timeNowMs: number = Date.now();
    const proposal = fakeProposal() as ProposalData;
    const customStatusRegex: RegExp = /what a great status!/i;

    let web3Instance: Web3;
    let mockWeb3Provider: FakeHttpProvider;

    const {rerender} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          web3Instance = p.web3Instance;
          mockWeb3Provider = p.mockWeb3Provider;
        }}>
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 1500}
          countdownGracePeriodStartMs={timeNowMs + 2500}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          // Render a status
          renderStatus={({
            votingStartEndInitReady,
            hasVotingStarted,
            hasVotingEnded,
          }) => {
            if (votingStartEndInitReady && hasVotingStarted && hasVotingEnded) {
              return <span>What a great status!</span>;
            }
          }}
        />
      </Wrapper>
    );

    // Inject mocked results for total units and single vote
    await waitFor(() => {
      mockWeb3VoteResults({mockWeb3Provider, web3Instance});
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(customStatusRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 500}
          countdownGracePeriodStartMs={timeNowMs + 1500}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          // Return falsy value, or do not provide a prop, in order to reset back to defaults
          renderStatus={() => {
            return undefined;
          }}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 500}
          countdownGracePeriodStartMs={timeNowMs + 1500}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          // Render a React.Fragment (truthy, but empty, value) in order to hide the status
          renderStatus={() => {
            return <></>;
          }}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    const renderStatusSpy = jest.fn();

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={timeNowMs}
          countdownVotingEndMs={timeNowMs + 500}
          countdownGracePeriodStartMs={timeNowMs + 1500}
          countdownGracePeriodEndMs={timeNowMs + 5000}
          proposal={proposal}
          // Use a spy to assert the correct arguments were provided to `renderStatus`
          renderStatus={renderStatusSpy}
        />
      </Wrapper>
    );

    // Assert spy calls
    await waitFor(() => {
      expect(renderStatusSpy.mock.calls.length > 0).toBe(true);

      expect(Object.keys(renderStatusSpy.mock.calls[0][0])).toEqual([
        'countdownGracePeriodEndMs',
        'countdownGracePeriodStartMs',
        'countdownVotingEndMs',
        'countdownVotingStartMs',
        'didVotePass',
        'gracePeriodStartEndInitReady',
        'hasGracePeriodEnded',
        'hasGracePeriodStarted',
        'hasVotingEnded',
        'hasVotingStarted',
        'votingStartEndInitReady',
      ]);
    });
  });
});
