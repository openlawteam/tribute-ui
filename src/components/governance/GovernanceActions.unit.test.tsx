import {render, waitFor, screen} from '@testing-library/react';
import {SnapshotType, VoteChoices} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../test/helpers';
import {GovernanceActions} from './GovernanceActions';
import {ProposalData, SnapshotProposal} from '../proposals/types';
import Wrapper from '../../test/Wrapper';

describe('GovernanceActions unit tests', () => {
  const nowSeconds = () => Date.now() / 1000;

  const defaultVotes: Partial<SnapshotProposal>['votes'] = [
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

  const fakeSnapshotProposal: () => ProposalData = () =>
    ({
      snapshotProposal: {
        msg: {
          payload: {
            snapshot: 123,
            name: '',
            body: '',
            choices: [VoteChoices.Yes, VoteChoices.No],
            metadata: {},
            start: nowSeconds() - 10,
            // Voting ended
            end: nowSeconds() + 3,
          },
          version: '',
          timestamp: '',
          token: '',
          type: SnapshotType.proposal,
        },
        actionId: '',
        address: '',
        authorIpfsHash: '',
        data: {authorIpfsHash: ''},
        idInDAO: DEFAULT_PROPOSAL_HASH,
        idInSnapshot: DEFAULT_PROPOSAL_HASH,
        relayerIpfsHash: '',
        sig: '',
        votes: defaultVotes,
      },
    } as Partial<SnapshotProposal> as ProposalData);

  test('should return correct content voting start -> voting end', async () => {
    const proposal = fakeSnapshotProposal();

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
        <GovernanceActions proposal={proposal} />
      </Wrapper>
    );

    await waitFor(() => {
      // Inject mocked units result
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // Total units
              web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
              // Units for "yes" voter
              web3Instance.eth.abi.encodeParameter('uint256', '200000'),
              // Units for "no" voter
              web3Instance.eth.abi.encodeParameter('uint256', '100000'),
            ],
          ]
        )
      );
    });

    await waitFor(() => {
      // SVG
      expect(screen.getByLabelText(/^proposal status$/i)).toBeInTheDocument();

      // Voting %
      expect(screen.getByText(/^2%$/i)).toBeInTheDocument();
      expect(screen.getByText(/^1%$/i)).toBeInTheDocument();

      // Voting buttons
      expect(
        screen.getByRole('button', {name: /^vote yes$/i})
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {name: /^vote no$/i})
      ).toBeInTheDocument();
    });

    // Voting end
    await waitFor(
      () => {
        // SVG
        expect(screen.getByLabelText(/^proposal status$/i)).toBeInTheDocument();

        expect(screen.getByText(/^approved$/i)).toBeInTheDocument();

        // Voting buttons should be hidden
        expect(() =>
          screen.getByRole('button', {name: /^vote yes$/i})
        ).toThrow();
        expect(() =>
          screen.getByRole('button', {name: /^vote no$/i})
        ).toThrow();
      },
      {timeout: 5000}
    );
  });
});
