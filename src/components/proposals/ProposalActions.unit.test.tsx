import {render, screen, waitFor} from '@testing-library/react';

import * as useProposalWithOffchainVoteStatusToMock from './hooks/useProposalWithOffchainVoteStatus';
import {
  CONTRACT_VOTING_OP_ROLLUP,
  createContractAction,
} from '../../store/actions';
import {ContractAdapterNames} from '../web3/types';
import {ProposalData, ProposalFlowStatus} from './types';
import ProposalActions from './ProposalActions';
import Wrapper from '../../test/Wrapper';

describe('ProposalActions component unit tests', () => {
  // @note Will use the offchain voting adapter set via test suite <Wrapper />.
  test('should render actions', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Sponsor,
        transitionMessage: undefined,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
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
      expect(screen.getByText(/sponsor/i)).toBeInTheDocument();
    });

    // Restore mock
    mock.mockRestore();
  });

  // @note Will use the offchain voting adapter set via test suite <Wrapper />.
  test('should render error when bad voting adapter name', async () => {
    const mock = jest
      .spyOn(
        useProposalWithOffchainVoteStatusToMock,
        'useProposalWithOffchainVoteStatus'
      )
      .mockImplementation(() => ({
        status: ProposalFlowStatus.Sponsor,
        transitionMessage: undefined,
        daoProposal: undefined,
        daoProposalVoteResult: undefined,
        daoProposalVotes: undefined,
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
              adapterName: 'CrappyVotingAdapterName' as any,
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
