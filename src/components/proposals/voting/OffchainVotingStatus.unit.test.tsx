import {SnapshotType, VoteChoices} from '@openlaw/snapshot-js-erc712';
import {render, screen, waitFor} from '@testing-library/react';

import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {OffchainVotingStatus} from './OffchainVotingStatus';
import {ProposalData} from '../types';
import MulticallABI from '../../../truffle-contracts/Multicall.json';
import Wrapper from '../../../test/Wrapper';

describe('OffchainVotingStatus unit tests', () => {
  const yesterday = Date.now() / 1000 - 86400;
  const now = Date.now() / 1000;

  // Bare minimum fake data
  const fakeProposal: Partial<ProposalData> = {
    snapshotDraft: undefined,
    snapshotProposal: {
      idInSnapshot: 'abc123',
      idInDAO: 'abc123',
      msg: {
        payload: {
          name: 'Such a great proposal',
          body: '',
          choices: [VoteChoices.Yes, VoteChoices.No],
          start: yesterday,
          end: now - 40000,
          snapshot: 100,
        },
        type: SnapshotType.proposal,
      },
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
                proposalHash:
                  '0x1679cac3f54777f5d9c95efd83beff9f87ac55487311ecacd95827d267a15c4e',
                metadata: {
                  memberAddress: DEFAULT_ETH_ADDRESS,
                },
              },
            },
            sig:
              '0xdbdbf122734b34ed5b10542551636e4250e98f443e35bf5d625f284fe54dcaf80c5bc44be04fefed1e9e5f25a7c13809a5266fcdbdcd0b94c885f2128544e79a1b',
            authorIpfsHash:
              '0xfe8f864ef475f60c7e01d5425df332199c5ae7ab712b8545f07433c68f06c644',
            relayerIpfsHash: '',
            actionId: '0xFCB86F90bd7b30cDB8A2c43FB15bf5B33A70Ea4f',
          },
        },
      ],
    } as any,
  };

  test('should render correct content', async () => {
    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          // Inject mocked units result 1
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
            ),
            {abi: MulticallABI, abiMethodName: 'aggregate'}
          );
        }}>
        <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(
        screen.getByLabelText(/getting off-chain voting status/i)
      ).toBeInTheDocument();
    });

    // Status
    await waitFor(() => {
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    });
  });

  test('should render correct content when providing a "votingResult"', async () => {
    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          proposal={fakeProposal as ProposalData}
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
      expect(
        screen.getByLabelText(/getting off-chain voting status/i)
      ).toBeInTheDocument();
    });

    // Status
    await waitFor(() => {
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    });
  });

  test('should render correct content when "countdownGracePeriodStartMs" provided', async () => {
    render(
      <Wrapper
        useInit
        useWallet
        getProps={({mockWeb3Provider, web3Instance}) => {
          // Inject mocked result for grace period end
          const result: [string] = [
            web3Instance.eth.abi.encodeParameter('uint256', 3),
          ];
          mockWeb3Provider.injectResult(...result);

          // Inject mocked results for total units and single vote
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
            ),
            {abi: MulticallABI, abiMethodName: 'aggregate'}
          );
        }}>
        <OffchainVotingStatus
          countdownGracePeriodStartMs={Date.now()}
          proposal={fakeProposal as ProposalData}
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
      expect(
        screen.getByLabelText(/getting off-chain voting status/i)
      ).toBeInTheDocument();
    });

    // Grace period label
    await waitFor(
      () => {
        expect(screen.getByText(/grace period ends/i)).toBeInTheDocument();
      },
      {timeout: 2000}
    );

    await waitFor(
      () => {
        expect(screen.getByText(/grace period ended/i)).toBeInTheDocument();
      },
      {timeout: 2000}
    );
  });
});
