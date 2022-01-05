import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {render, screen, waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../test/helpers';
import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import {snapshotAPIProposalResponse} from '../../test/restResponses';
import GovernanceProposals from './GovernanceProposals';
import Wrapper from '../../test/Wrapper';

describe('GovernanceProposals unit tests', () => {
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
  ];

  const defaultProposalBody = Object.values(snapshotAPIProposalResponse)[0];

  const proposalsResponse: typeof snapshotAPIProposalResponse = {
    // Proposal passed
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
      votes: defaultProposalVotes,
    },
  };

  test('should render correct content', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:adapterAddress`,
          async (_req, res, ctx) => res(ctx.json(proposalsResponse))
        ),
      ]
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
        <GovernanceProposals />
      </Wrapper>
    );

    await waitFor(() => {
      /**
       * Inject voting results. The order should align with the order above of fake responses.
       */

      // Inject passed result
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter('uint256', '30000000'),
              web3Instance.eth.abi.encodeParameter('uint256', '20000000'),
              web3Instance.eth.abi.encodeParameter('uint256', '200000'),
            ],
          ]
        )
      );
    });

    // Header
    await waitFor(() => {
      expect(screen.getByText(/^governance$/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: /^new proposal$/i})
      ).toBeInTheDocument();
    });

    // Proposal cards
    await waitFor(() => {
      // Proposal headers
      expect(screen.getByText(/^passed$/i)).toBeInTheDocument();

      // Proposal names
      expect(screen.getByText(/^another cool one$/i)).toBeInTheDocument();
    });
  });
});
