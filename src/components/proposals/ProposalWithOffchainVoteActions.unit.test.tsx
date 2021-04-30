import {render, screen, waitFor} from '@testing-library/react';

import {ContractAdapterNames} from '../web3/types';
import {DEFAULT_ETH_ADDRESS} from '../../test/helpers';
import {ProposalData, ProposalFlowStatus} from './types';
import {VotingAdapterName} from '../adapters-extensions/enums';
import * as useProposalWithOffchainVoteStatusToMock from './hooks/useProposalWithOffchainVoteStatus';
import ProposalWithOffchainVoteActions from './ProposalWithOffchainVoteActions';
import Wrapper from '../../test/Wrapper';

describe('ProposalWithOffchainVoteActions component unit tests', () => {
  test('should render default submit action', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Submit,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
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
      // Status should not show
      expect(() => screen.getAllByText(/0%/i)).toThrow();

      // @note The submit action uses the text "Sponsor" for its button
      expect(
        screen.getByRole('button', {name: /sponsor/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render default sponsor action', async () => {
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
        <ProposalWithOffchainVoteActions
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
      // Status should not show
      expect(() => screen.getAllByText(/0%/i)).toThrow();

      expect(
        screen.getByRole('button', {name: /sponsor/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render default off-chain voting action', async () => {
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
        <ProposalWithOffchainVoteActions
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

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

  test('should render default off-chain submit result action', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingSubmitResult,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(
        screen.getByRole('button', {name: /submit vote result/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render default process action when in grace period', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingGracePeriod,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
          // Using a different name than `onboarding` as it has a custom process action
          adapterName={ContractAdapterNames.managing}
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(
        screen.getByRole('button', {name: /process/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render default process action', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Process,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
          // Using a different name than `onboarding` as it has a custom process action
          adapterName={ContractAdapterNames.managing}
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(
        screen.getByRole('button', {name: /process/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render no action by default if proposal processed', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Completed,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
        proposalFlowStatusError: undefined,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
          // Using a different name than `onboarding` as it has a custom process action
          adapterName={ContractAdapterNames.managing}
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(() => screen.getByRole('button', {name: /sponsor/i})).toThrow();

      expect(() =>
        screen.getByRole('button', {name: /submit vote result/i})
      ).toThrow();

      expect(() => screen.getByRole('button', {name: /vote yes/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /vote no/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /process/i})).toThrow();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render action using `renderAction` prop', async () => {
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
        <ProposalWithOffchainVoteActions
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(
        screen.getByRole('button', {name: /some awesome action/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render no content for action using `renderAction` prop if returns `<></>`', async () => {
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
        <ProposalWithOffchainVoteActions
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

      expect(() =>
        screen.getByRole('button', {name: /some awesome action/i})
      ).toThrow();
      expect(() => screen.getByRole('button', {name: /vote yes/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /vote no/i})).toThrow();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should fall back to default action using `renderAction` prop if returns `null`', async () => {
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
        <ProposalWithOffchainVoteActions
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
      // Status
      expect(screen.getAllByText(/0%/i).length).toBe(2);

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
});
