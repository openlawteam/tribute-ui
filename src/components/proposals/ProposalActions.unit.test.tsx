import {render, screen, waitFor} from '@testing-library/react';

import {
  CONTRACT_VOTING_OP_ROLLUP,
  createContractAction,
} from '../../store/actions';
import {ContractAdapterNames} from '../web3/types';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {ProposalData, ProposalFlowStatus} from './types';
import {VotingAdapterName} from '../adapters-extensions/enums';
import * as useProposalWithOffchainVoteStatusToMock from './hooks/useProposalWithOffchainVoteStatus';
import ProposalActions from './ProposalActions';
import Wrapper from '../../test/Wrapper';

describe('ProposalActions component unit tests', () => {
  // @note Will use the dao's offchain voting adapter set via test suite <Wrapper />.
  test('should render off-chain actions using dao voting adapter', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Sponsor,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotDraft: {
                msg: {
                  payload: {
                    name: 'Good Title',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /sponsor/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render off-chain actions using proposal voting adapter', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVoting,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
                msg: {
                  payload: {
                    name: 'Another Good Title',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
              daoProposalVotingAdapter: {
                votingAdapterAddress: DEFAULT_ETH_ADDRESS,
                votingAdapterName: VotingAdapterName.OffchainVotingContract,
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /vote yes/i})
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: /vote no/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render off-chain action using `renderAction` prop', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVoting,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
                msg: {
                  payload: {
                    name: 'Another Good Title',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
              daoProposalVotingAdapter: {
                votingAdapterAddress: DEFAULT_ETH_ADDRESS,
                votingAdapterName: VotingAdapterName.OffchainVotingContract,
              },
            } as ProposalData
          }
          renderAction={({OffchainVotingContract: {status}}) => {
            if (status === ProposalFlowStatus.OffchainVoting) {
              return <button>Some awesome action</button>;
            }

            return null;
          }}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /some awesome action/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render no content for off-chain action using `renderAction` prop if returns `<></>`', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVoting,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
                msg: {
                  payload: {
                    name: 'Another Good Title',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
              daoProposalVotingAdapter: {
                votingAdapterAddress: DEFAULT_ETH_ADDRESS,
                votingAdapterName: VotingAdapterName.OffchainVotingContract,
              },
            } as ProposalData
          }
          renderAction={({OffchainVotingContract: {status}}) => {
            if (status === ProposalFlowStatus.Submit) {
              return <button>Some awesome action</button>;
            }

            // This will cause nothing to show
            return <></>;
          }}
        />
      </Wrapper>
    );

    // Assert to render no actions
    await waitFor(() => {
      expect(() =>
        screen.getByRole('button', {name: /some awesome action/i})
      ).toThrow();
      expect(() => screen.getByRole('button', {name: /vote yes/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /vote no/i})).toThrow();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should fall back to default off-chain action using `renderAction` prop if returns `null`', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVoting,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
                msg: {
                  payload: {
                    name: 'Another Good Title',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
              daoProposalVotingAdapter: {
                votingAdapterAddress: DEFAULT_ETH_ADDRESS,
                votingAdapterName: VotingAdapterName.OffchainVotingContract,
              },
            } as ProposalData
          }
          renderAction={({OffchainVotingContract: {status}}) => {
            if (status === ProposalFlowStatus.OffchainVoting) {
              // `null` cause the child component to use its default actions
              return null;
            }
          }}
        />
      </Wrapper>
    );

    // Assert to render default action
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /vote yes/i})
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: /vote no/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  // @note Will use the dao's offchain voting adapter set via test suite <Wrapper />.
  test('should render error when bad voting adapter name', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Sponsor,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({store}) => {
          store.dispatch(
            createContractAction({
              type: CONTRACT_VOTING_OP_ROLLUP,
              abi: [],
              adapterOrExtensionName: 'CrappyVotingAdapterName' as any,
              contractAddress: '',
              instance: {} as any,
            })
          );
        }}>
        <ProposalActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotDraft: {
                msg: {
                  payload: {
                    name: 'Good Proposal',
                    body: 'Coolness',
                    metadata: {},
                  },
                  timestamp: Date.now().toString(),
                },
              },
            } as ProposalData
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /"CrappyVotingAdapterName" is not a valid voting adapter name\./i
        )
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });
});
