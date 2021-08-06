import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {ContractAdapterNames} from '../../web3/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {OffchainVotingAction} from './OffchainVotingAction';
import {ProposalData, SnapshotProposal} from '../types';
import {server, rest} from '../../../test/server';
import {setConnectedMember} from '../../../store/actions';
import {ethBlockNumber, signTypedDataV4} from '../../../test/web3Responses';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {snapshotAPIProposalResponse} from '../../../test/restResponses';
import Wrapper from '../../../test/Wrapper';

describe('OffchainVotingAction unit tests', () => {
  const alreadyVotedRegex: RegExp = /you have already voted\./i;
  const errorTextRegex: RegExp = /something went wrong/i;
  const votedYesButtonRegex: RegExp = /voted yes/i;
  const voteNoButtonRegex: RegExp = /vote no/i;
  const voteYesButtonRegex: RegExp = /vote yes/i;
  const votingWhyDisabledRegex: RegExp = /why is voting disabled\?/i;

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

  // Use just enough proposal fixture data for what the test needs
  const defaultProposalData = (
    refetchSpy: jest.Mock
  ): Partial<ProposalData> => ({
    snapshotProposal: {
      ...defaultProposalBody,
      msg: {
        ...defaultProposalBody.msg,
        payload: {
          ...defaultProposalBody.msg.payload,
          name: 'Another cool one',
          // Set the snapshot as this test will use the eth block number against the snapshot
          snapshot: 100,
        },
      },
      data: {
        erc712DraftHash:
          '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3434',
        authorIpfsHash: '',
      },
      votes: [],
      idInDAO:
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3434',
      idInSnapshot:
        '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333',
    } as SnapshotProposal,

    refetchProposalOrDraft: refetchSpy,
  });

  test('should submit a vote', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {rerender} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock RPC response for `useMemberUnitsAtSnapshot`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeEnabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeEnabled();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
      expect(() => screen.getByText(votingWhyDisabledRegex)).toThrow();
    });

    await waitFor(() => {
      // Mock signature response
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
    });

    // Submit vote
    userEvent.click(screen.getByRole('button', {name: voteYesButtonRegex}));

    // Assert voting progress
    await waitFor(() => {
      expect(
        screen.getByLabelText(/currently voting yes\.\.\./i)
      ).toBeInTheDocument();
    });

    const proposalWithVotes = {
      ...proposal,
      snapshotProposal: {
        ...proposal.snapshotProposal,
        votes: defaultProposalVotes,
      },
    };

    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalWithVotes as ProposalData}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: votedYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: votedYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert "why voting disabled modal" content
    await waitFor(() => {
      expect(screen.getByText(alreadyVotedRegex)).toBeInTheDocument();
    });

    // Assert refetch was called
    await waitFor(() => {
      expect(refetchSpy.mock.calls.length === 1).toBe(true);
    });
  });

  test('should disable submitting a vote when not a member before snapshot', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Mock RPC response for `useMemberUnitsAtSnapshot`
    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      mockWeb3Provider.injectResult(
        // Address had no weight at snapshot
        web3Instance.eth.abi.encodeParameter('uint256', 0)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert `noMembershipAtSnapshotMessage` message content
    await waitFor(() => {
      expect(
        screen.getByText(
          /you were not a member when the proposal was sponsored at snapshot 100\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should disable submitting a vote when address is delegated', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;
    let store: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
          store = p.store;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Mock RPC response for `useMemberUnitsAtSnapshot`
    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      mockWeb3Provider.injectResult(
        // Address had no weight at snapshot
        web3Instance.eth.abi.encodeParameter('uint256', 0)
      );
    });

    // Wait for connected member state to be set
    await waitFor(() => {
      expect(store.getState().connectedMember).not.toBe(null);
    });

    await waitFor(() => {
      store.dispatch(
        setConnectedMember({
          ...store.getState().connectedMember,
          delegateKey: '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d',
          isAddressDelegated: true,
        })
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert `addressIsDelegatedMessage` message content
    await waitFor(() => {
      expect(
        screen.getByText(
          /your member address is delegated to 0xE11BA\.\.\.82d\. You must use that address to vote\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should disable submitting a vote when already voted', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    const proposalWithVotes = {
      ...proposal,
      snapshotProposal: {
        ...proposal.snapshotProposal,
        votes: defaultProposalVotes,
      },
    };

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalWithVotes as ProposalData}
        />
      </Wrapper>
    );

    // Mock RPC response for `useMemberUnitsAtSnapshot`
    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      mockWeb3Provider.injectResult(
        // Address had no weight at snapshot
        web3Instance.eth.abi.encodeParameter('uint256', 0)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: votedYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: votedYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert `alreadyVotedMessage` message content
    await waitFor(() => {
      expect(screen.getByText(alreadyVotedRegex)).toBeInTheDocument();
    });
  });

  test('should disable submitting a vote when waiting on `useMemberUnitsAtSnapshot` polling', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Mock RPC response for `useMemberUnitsAtSnapshot`
    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 100, web3Instance})
      );

      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 101, web3Instance})
      );

      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 102, web3Instance})
      );

      mockWeb3Provider.injectResult(
        // Address had no weight at snapshot
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert `undeterminedMembershipAtSnapshotMessage` message content
    await waitFor(() => {
      expect(
        screen.getByText(
          /we are waiting on your membership status for when this proposal was sponsored at snapshot 100\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should disable submitting a vote when `useMemberUnitsAtSnapshot` fails', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {rerender} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    // Mock RPC response for `useMemberUnitsAtSnapshot`
    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      mockWeb3Provider.injectResult(
        // Address had no weight at snapshot
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    const proposalToForceRerender = {
      ...proposal,
      snapshotProposal: {
        ...proposal.snapshotProposal,
        msg: {
          ...proposal.snapshotProposal?.msg,
          payload: {
            ...proposal.snapshotProposal?.msg.payload,
            // Update the snapshot to make `useMemberUnitsAtSnapshot` re-run
            snapshot: 789,
          },
        },
      },
    };

    /**
     * We re-render as the timing is difficult to get right when
     * trying to mock the `useMemberUnitsAtSnapshot` error.
     */
    rerender(
      <Wrapper
        useInit
        useWallet
        getProps={() => {
          mockWeb3Provider.injectError({
            code: 123,
            message: 'Some bad error',
          });
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalToForceRerender as ProposalData}
        />
      </Wrapper>
    );

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
    });

    // Click the "why disabled?" link
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    // Assert `undeterminedMembershipAtSnapshotMessage` message content
    await waitFor(() => {
      expect(
        screen.getByText(
          /something went wrong\. your membership status when this proposal was sponsored at snapshot 789 cannot be determined\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should show an error when signing a vote fails', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock RPC response for `useMemberUnitsAtSnapshot`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeEnabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeEnabled();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
      expect(() => screen.getByText(votingWhyDisabledRegex)).toThrow();
    });

    await waitFor(() => {
      // Mock signature error response
      mockWeb3Provider.injectError({code: 1234, message: 'Some bad error'});
    });

    // Submit vote
    userEvent.click(screen.getByRole('button', {name: voteYesButtonRegex}));

    // Assert voting progress
    await waitFor(() => {
      expect(
        screen.getByLabelText(/currently voting yes\.\.\./i)
      ).toBeInTheDocument();
    });

    // Assert error message
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeEnabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeEnabled();

      expect(screen.getByText(errorTextRegex)).toBeInTheDocument();
      expect(screen.getByText(/some bad error/i)).toBeInTheDocument();

      expect(() => screen.getByText(votingWhyDisabledRegex)).toThrow();
    });

    // Assert refetch was called
    await waitFor(() => {
      expect(refetchSpy.mock.calls.length === 0).toBe(true);
    });
  });

  test('should show an error when submitting a vote fails', async () => {
    // Mock a Snapshot `POST` error
    server.use(
      rest.post(`${SNAPSHOT_HUB_API_URL}/api/message`, async (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock RPC response for `useMemberUnitsAtSnapshot`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    // Assert content
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeEnabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeEnabled();

      expect(() => screen.getByText(errorTextRegex)).toThrow();
      expect(() => screen.getByText(votingWhyDisabledRegex)).toThrow();
    });

    await waitFor(() => {
      // Mock signature response
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
    });

    // Submit vote
    userEvent.click(screen.getByRole('button', {name: voteYesButtonRegex}));

    // Assert voting progress
    await waitFor(() => {
      expect(
        screen.getByLabelText(/currently voting yes\.\.\./i)
      ).toBeInTheDocument();
    });

    // Assert error message
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeEnabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeEnabled();

      expect(screen.getByText(errorTextRegex)).toBeInTheDocument();

      expect(
        screen.getByText(/request failed with status code 500/i)
      ).toBeInTheDocument();

      expect(() => screen.getByText(votingWhyDisabledRegex)).toThrow();
    });

    // Assert refetch was called
    await waitFor(() => {
      expect(refetchSpy.mock.calls.length === 0).toBe(true);
    });
  });

  test('should show an error when `useMemberUnitsAtSnapshot` fails', async () => {
    const refetchSpy = jest.fn();
    const proposal = defaultProposalData(refetchSpy) as ProposalData;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {rerender} = render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    await waitFor(() => {
      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        // Set a higher block than the fake proposal
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock RPC response for `useMemberUnitsAtSnapshot`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );
    });

    const proposalToForceRerender = {
      ...proposal,
      snapshotProposal: {
        ...proposal.snapshotProposal,
        msg: {
          ...proposal.snapshotProposal?.msg,
          payload: {
            ...proposal.snapshotProposal?.msg.payload,
            // Update the snapshot to make `useMemberUnitsAtSnapshot` re-run
            snapshot: 789,
          },
        },
      },
    };

    /**
     * We re-render as the timing is difficult to get right when
     * trying to mock the `useMemberUnitsAtSnapshot` error.
     */
    rerender(
      <Wrapper
        useInit
        useWallet
        getProps={() => {
          mockWeb3Provider.injectError({
            code: 123,
            message: 'Some bad error',
          });
        }}>
        <OffchainVotingAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalToForceRerender as ProposalData}
        />
      </Wrapper>
    );

    // Assert error message
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: voteYesButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: voteNoButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(errorTextRegex)).toBeInTheDocument();
      expect(screen.getByText(/some bad error/i)).toBeInTheDocument();

      expect(screen.getByText(votingWhyDisabledRegex)).toBeInTheDocument();
    });

    // Click the "why disabled" modal to view the text
    userEvent.click(screen.getByText(votingWhyDisabledRegex));

    await waitFor(() => {
      expect(
        screen.getByText(
          /something went wrong\. your membership status when this proposal was sponsored at snapshot 789 cannot be determined\./i
        )
      ).toBeInTheDocument();
    });
  });
});
