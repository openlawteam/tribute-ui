import {render, screen, waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {AsyncStatus} from '../../util/types';
import {ContractAdapterNames} from '../web3/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {ProposalData, ProposalFlowStatus} from './types';
import {VotingAdapterName} from '../adapters-extensions/enums';
import * as useOffchainVotingResultsToMock from './hooks/useOffchainVotingResults';
import * as useProposalWithOffchainVoteStatusToMock from './hooks/useProposalWithOffchainVoteStatus';
import ProposalWithOffchainVoteActions from './ProposalWithOffchainVoteActions';
import Wrapper from '../../test/Wrapper';

/**
 * @todo Instead of mocking away the hooks in the case of efficiency (e.g. `useProposalWithOffchainVoteStatus`),
 *   with the exception of `useDaoConfigurations`, we should use more complete snapshot
 *   draft and proposal data to provide to the hooks, and use `FakeHttpProvider` to mock their results.
 */
describe('ProposalWithOffchainVoteActions component unit tests', () => {
  function mockDaoConfigResults({
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
            // ContractDAOConfigKeys.offchainVotingVotingPeriod
            web3Instance.eth.abi.encodeParameter('uint256', '120'),
            // ContractDAOConfigKeys.offchainVotingGracePeriod
            web3Instance.eth.abi.encodeParameter('uint256', '60'),
          ],
        ]
      )
    );
  }

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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
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
        screen.getByRole('button', {name: /^sponsor$/i})
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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
        screen.getByRole('button', {name: /^vote yes$/i})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: /^vote no$/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render default off-chain submit result action for passing vote', async () => {
    const useProposalWithOffchainVoteStatusMock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingSubmitResult,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    const useOffchainVotingResultsMock = jest
      .spyOn(useOffchainVotingResultsToMock, 'useOffchainVotingResults')
      .mockImplementation(() => ({
        offchainVotingResults: [
          [
            '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111',
            {
              Yes: {percentage: 0.02, units: 200000},
              No: {percentage: 0.01, units: 100000},
              totalUnits: 10000000,
            },
          ],
        ],
        offchainVotingResultsError: undefined,
        offchainVotingResultsStatus: AsyncStatus.FULFILLED,
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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
      expect(screen.getAllByText(/2%/i).length).toBe(1);
      expect(screen.getAllByText(/1%/i).length).toBe(1);

      expect(
        screen.getByRole('button', {name: /^submit vote result$/i})
      ).toBeInTheDocument();
    });

    // Restore mocks
    useProposalWithOffchainVoteStatusMock.mockRestore();
    useOffchainVotingResultsMock.mockRestore();
  });

  test('should not render off-chain submit result action for failing vote', async () => {
    const useProposalWithOffchainVoteStatusMock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingSubmitResult,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    const useOffchainVotingResultsMock = jest
      .spyOn(useOffchainVotingResultsToMock, 'useOffchainVotingResults')
      .mockImplementation(() => ({
        offchainVotingResults: [
          [
            '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111',
            {
              Yes: {percentage: 0.01, units: 100000},
              No: {percentage: 0.02, units: 200000},
              totalUnits: 10000000,
            },
          ],
        ],
        offchainVotingResultsError: undefined,
        offchainVotingResultsStatus: AsyncStatus.FULFILLED,
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
      expect(screen.getAllByText(/1%/i).length).toBe(1);
      expect(screen.getAllByText(/2%/i).length).toBe(1);

      expect(() =>
        screen.getByRole('button', {name: /submit vote result/i})
      ).toThrow();
    });

    // Restore mocks
    useProposalWithOffchainVoteStatusMock.mockRestore();
    useOffchainVotingResultsMock.mockRestore();
  });

  test('should not render off-chain submit result action until vote tallies fulfilled', async () => {
    const proposal = {
      snapshotProposal: {
        msg: {
          payload: {
            name: 'Good Title',
            body: 'Coolness',
            metadata: {},
          },
          timestamp: Date.now().toString(),
        },
      },
    } as ProposalData;

    const useProposalWithOffchainVoteStatusMock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingSubmitResult,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    const useOffchainVotingResultsMock = jest
      .spyOn(useOffchainVotingResultsToMock, 'useOffchainVotingResults')
      .mockImplementation(() => ({
        offchainVotingResults: [
          [
            '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111',
            {
              Yes: {percentage: 0.01, units: 100000},
              No: {percentage: 0.02, units: 200000},
              totalUnits: 10000000,
            },
          ],
        ],
        offchainVotingResultsError: undefined,
        offchainVotingResultsStatus: AsyncStatus.PENDING,
      }));

    render(
      <Wrapper useInit useWallet>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={proposal}
        />
      </Wrapper>
    );

    await waitFor(() => {
      // Status
      expect(screen.getAllByText(/1%/i).length).toBe(1);
      expect(screen.getAllByText(/2%/i).length).toBe(1);

      expect(() =>
        screen.getByRole('button', {name: /submit vote result/i})
      ).toThrow();
    });
    // Restore mocks
    useProposalWithOffchainVoteStatusMock.mockRestore();
    useOffchainVotingResultsMock.mockRestore();
  });

  test('should call `stopPollingForStatus` if off-chain submit result action and failing vote', async () => {
    const stopPollingForStatusSpy = jest.fn();

    const useProposalWithOffchainVoteStatusMock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingSubmitResult,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: stopPollingForStatusSpy,
      }));

    const useOffchainVotingResultsMock = jest
      .spyOn(useOffchainVotingResultsToMock, 'useOffchainVotingResults')
      .mockImplementation(() => ({
        offchainVotingResults: [
          [
            '0xb22ca9af120bfddfc2071b5e86a9edee6e0e2ab76399e7c2d96a9d502f5c1111',
            {
              Yes: {percentage: 0.01, units: 100000},
              No: {percentage: 0.02, units: 200000},
              totalUnits: 10000000,
            },
          ],
        ],
        offchainVotingResultsError: undefined,
        offchainVotingResultsStatus: AsyncStatus.FULFILLED,
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
      expect(screen.getAllByText(/1%/i).length).toBe(1);
      expect(screen.getAllByText(/2%/i).length).toBe(1);

      expect(() =>
        screen.getByRole('button', {name: /submit vote result/i})
      ).toThrow();
    });

    expect(stopPollingForStatusSpy.mock.calls.length).toBe(1);

    // Restore mocks
    useProposalWithOffchainVoteStatusMock.mockRestore();
    useOffchainVotingResultsMock.mockRestore();
  });

  test('should render default process action when in grace period', async () => {
    const useHookMock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.OffchainVotingGracePeriod,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: {
          gracePeriodStartingTime: Math.floor(Date.now() / 1000).toString(),
        } as any,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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

    // Button
    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /^process$/i})
      ).toBeInTheDocument();
    });

    // Status
    await waitFor(
      () => {
        expect(screen.getByText(/^grace period:/i)).toBeInTheDocument();
        expect(screen.getAllByText(/0%/i).length).toBe(2);
      },
      {timeout: 5000}
    );

    // Restore mocks
    useHookMock.mockRestore();
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          // Using a different name than `onboarding` as it has a custom process action
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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

      expect(() => screen.getByRole('button', {name: /^sponsor$/i})).toThrow();

      expect(() =>
        screen.getByRole('button', {name: /^submit vote result$/i})
      ).toThrow();

      expect(() => screen.getByRole('button', {name: /^vote yes$/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /^vote no$/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /^process$/i})).toThrow();
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
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
        screen.getByRole('button', {name: /^some awesome action$/i})
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
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
        screen.getByRole('button', {name: /^some awesome action$/i})
      ).toThrow();

      expect(() => screen.getByRole('button', {name: /^vote yes$/i})).toThrow();
      expect(() => screen.getByRole('button', {name: /^vote no$/i})).toThrow();
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
        daoProposalVote: undefined,
        proposalFlowStatusError: undefined,
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
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
        screen.getByRole('button', {name: /^vote yes$/i})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: /^vote no$/i})
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  test('should render error', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: undefined,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVote: undefined,
        proposalFlowStatusError: new Error('Something bad happened.'),
        stopPollingForStatus: () => {},
      }));

    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          mockDaoConfigResults({mockWeb3Provider, web3Instance});
        }}>
        <ProposalWithOffchainVoteActions
          adapterName={ContractAdapterNames.onboarding}
          proposal={
            {
              snapshotProposal: {
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
        screen.getByText(
          /something went wrong while getting the proposal's status/i
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(/^something bad happened.$/i)
      ).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });
});
