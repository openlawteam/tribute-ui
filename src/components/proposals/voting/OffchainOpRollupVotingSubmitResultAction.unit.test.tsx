import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {render} from '@testing-library/react';
import {screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';
import userEvent from '@testing-library/user-event';
import Web3 from 'web3';

import {
  ethBlockNumber,
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
  signTypedDataV4,
} from '../../../test/web3Responses';
import {ContractAdapterNames} from '../../web3/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {OffchainOpRollupVotingSubmitResultAction} from '.';
import {ProposalData, SnapshotProposal} from '../types';
import {rest, server} from '../../../test/server';
import {setConnectedMember} from '../../../store/actions';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {snapshotAPIProposalResponse} from '../../../test/restResponses';
import {TX_CYCLE_MESSAGES} from '../../web3/config';
import OffchainVotingABI from '../../../abis/OffchainVotingContract.json';
import Wrapper from '../../../test/Wrapper';

const somethingWentWrongRegex: RegExp = /^something went wrong$/i;
const submitVoteResultButtonRegex: RegExp = /^submit vote result$/i;
const whyDisabledButtonRegex: RegExp = /^why is submitting disabled\?$/i;

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

const proposalData: Partial<ProposalData> = {
  snapshotProposal: {
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
    votes: defaultProposalVotes,
    idInDAO:
      '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3434',
    idInSnapshot:
      '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c3333',
  } as SnapshotProposal,
};

function mockInitialCallsHelper(
  mockWeb3Provider: FakeHttpProvider,
  web3Instance: Web3,
  options?: {
    getBadNodeError?: () => void;
    getMemberAddress?: () => void;
    getNbMembers?: () => void;
    getPriorAmount?: () => void;
    signature?: () => void;
  }
): void {
  // Mock RPC call for `getNbMembers`
  options?.getNbMembers?.() ||
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameter('uint256', 4),
      {debugName: 'getNbMembers'}
    );

  // Mock `multicall` for `getMemberAddress`
  options?.getMemberAddress?.() ||
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // Let's pretend this is the DaoFactory
            web3Instance.eth.abi.encodeParameter(
              'address',
              '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
            ),
            // Let's pretend this is the DAO deployer
            web3Instance.eth.abi.encodeParameter(
              'address',
              '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
            ),
            // Voters from `defaultProposalVotes`
            web3Instance.eth.abi.encodeParameter(
              'address',
              DEFAULT_ETH_ADDRESS
            ),
            web3Instance.eth.abi.encodeParameter(
              'address',
              '0xc0437e11094275376defbe51dc6e04598403d276'
            ),
          ],
        ]
      ),
      {debugName: 'getMemberAddress multicall'}
    );

  // Mock `multicall` for `getPriorAmount`
  options?.getPriorAmount?.() ||
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            // For `getPriorAmount` calls
            web3Instance.eth.abi.encodeParameter('uint256', '0'),
            web3Instance.eth.abi.encodeParameter('uint256', '1'),
            web3Instance.eth.abi.encodeParameter('uint256', '200000'),
            web3Instance.eth.abi.encodeParameter('uint256', '100000'),
          ],
        ]
      ),
      {debugName: 'getPriorAmount multicall'}
    );

  // Mock `getBadNodeError` call `BadNodeError.OK`
  options?.getBadNodeError?.() ||
    mockWeb3Provider.injectResult(
      web3Instance.eth.abi.encodeParameter('uint256', '0'),
      {debugName: 'getBadNodeError'}
    );

  // Mock signature
  options?.signature?.() ||
    mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
}

describe('OffchainOpRollupVotingSubmitResultAction unit tests', () => {
  test('should submit a vote result (off-chain proof was not submitted previously)', async () => {
    /**
     * Mock response to set that the off-chain proof was not submitted previously.
     * The default is a 200 response.
     */
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(404))
      )
    );

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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance);
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(
        screen.getByText(/awaiting your confirmation/i)
      ).toBeInTheDocument();
    });

    // Mock RPC calls for `submitVoteResult`
    await waitFor(() => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    await waitFor(() => {
      // The component start `useFirstItemStart = true` for `<CycleMessage />`
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
      expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/result submitted!/i)).toBeInTheDocument();
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });

  test('should submit a vote result (off-chain proof was submitted previously)', async () => {
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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance);
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(
        screen.getByText(/awaiting your confirmation/i)
      ).toBeInTheDocument();
    });

    // Mock RPC calls for `submitVoteResult`
    await waitFor(() => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    await waitFor(() => {
      // The component start `useFirstItemStart = true` for `<CycleMessage />`
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
      expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/result submitted!/i)).toBeInTheDocument();
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });

  test('should show an error when submitting vote result fails', async () => {
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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls for signature and set mock error
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance, {
        // Mock RPC error
        getPriorAmount: () =>
          mockWeb3Provider.injectError({
            code: 1234,
            message: 'Some really nasty error',
          }),
      });
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(screen.getByText(somethingWentWrongRegex)).toBeInTheDocument();

      expect(
        screen.getByText(/^some really nasty error$/i)
      ).toBeInTheDocument();
    });
  });

  test('should show an error when `getBadNodeError` != `BadNodeError.OK`', async () => {
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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls for a bad node error
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance, {
        getBadNodeError: () =>
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', '1')
          ),
      });
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(screen.getByText(somethingWentWrongRegex)).toBeInTheDocument();

      expect(
        screen.getByText(
          /^cannot submit off-chain voting result\. node has an error: WRONG_PROPOSAL_ID\.$/i
        )
      ).toBeInTheDocument();
    });
  });

  test('should show an error when getting Snapshot off-chain proof fails', async () => {
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance);
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(screen.getByText(somethingWentWrongRegex)).toBeInTheDocument();

      expect(
        screen.getByText(
          /something went wrong while getting the off-chain vote proof\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should show an error when submitting Snapshot off-chain proof fails', async () => {
    /**
     * Mock response to set that the off-chain proof was not submitted previously.
     * The default is a 200 response.
     */
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(404))
      )
    );

    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

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
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              ...proposalData,
              daoProposalVotingAdapter: {
                getWeb3VotingAdapterContract: () =>
                  new web3Instance.eth.Contract(
                    OffchainVotingABI as any,
                    DEFAULT_ETH_ADDRESS
                  ),
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeEnabled();
    });

    // Setup: Mock RPC calls
    await waitFor(() => {
      mockInitialCallsHelper(mockWeb3Provider, web3Instance);
    });

    userEvent.click(
      screen.getByRole('button', {name: submitVoteResultButtonRegex})
    );

    await waitFor(() => {
      expect(screen.getByText(somethingWentWrongRegex)).toBeInTheDocument();
      expect(
        screen.getByText(
          /something went wrong while submitting the off-chain vote proof\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should disable the submit button if not a member', async () => {
    let store: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          store = p.store;
        }}>
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalData as ProposalData}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: whyDisabledButtonRegex})
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      store.dispatch(
        setConnectedMember({
          delegateKey: DEFAULT_ETH_ADDRESS,
          isActiveMember: false,
          isAddressDelegated: false,
          memberAddress: DEFAULT_ETH_ADDRESS,
        })
      );
    });

    userEvent.click(screen.getByRole('button', {name: whyDisabledButtonRegex}));

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeDisabled();

      expect(screen.getByText(/why is this disabled\?/i)).toBeInTheDocument();

      expect(
        screen.getByText(
          /either you are not a member, or your membership is not active\./i
        )
      ).toBeInTheDocument();
    });
  });

  test('should disable the submit button if not connected to a wallet', async () => {
    render(
      <Wrapper useInit>
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalData as ProposalData}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeDisabled();
    });

    // check again after any component updates
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: whyDisabledButtonRegex})
      ).toBeInTheDocument();
    });
  });

  test('should show the <WhyDisabledModal />', async () => {
    render(
      <Wrapper useInit>
        <OffchainOpRollupVotingSubmitResultAction
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposalData as ProposalData}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeDisabled();
    });

    // check again after any component updates
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: submitVoteResultButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: whyDisabledButtonRegex})
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('button', {name: whyDisabledButtonRegex}));

    await waitFor(() => {
      expect(screen.getByText(/why is this disabled\?/i)).toBeInTheDocument();

      expect(
        screen.getByText(/your wallet is not connected\./i)
      ).toBeInTheDocument();
    });
  });
});
