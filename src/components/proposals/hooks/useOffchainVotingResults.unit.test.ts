import {renderHook, act} from '@testing-library/react-hooks';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {SnapshotProposal} from '../types';
import {useOffchainVotingResults} from './useOffchainVotingResults';
import {VoteChoices} from '../../web3/types';
import Wrapper from '../../../test/Wrapper';

const fakeSnapshotProposal: SnapshotProposal = {
  msg: {
    payload: {
      snapshot: 123,
      name: '',
      body: '',
      choices: [VoteChoices.Yes, VoteChoices.No],
      metadata: {},
      start: 0,
      end: 0,
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
  ],
};

describe('useOffchainVotingResults unit tests', () => {
  test('should return correct data', async () => {
    const someRandomHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000';

    const fakeSnapshotProposals: SnapshotProposal[] = [
      fakeSnapshotProposal,
      {
        ...fakeSnapshotProposal,
        idInDAO: someRandomHash,
        idInSnapshot: someRandomHash,
      },
    ];

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useOffchainVotingResults(fakeSnapshotProposals),
      {
        wrapper: Wrapper,
        initialProps: {
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
          useInit: true,
          useWallet: true,
        },
      }
    );

    await act(async () => {
      expect(result.current.offchainVotingResults).toMatchObject([]);
      expect(result.current.offchainVotingResultsError).toBe(undefined);
      expect(result.current.offchainVotingResultsStatus).toBe(
        AsyncStatus.STANDBY
      );

      // Inject mocked units result 1
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter('uint256', '10000000'),
              web3Instance.eth.abi.encodeParameter('uint256', '200000'),
              web3Instance.eth.abi.encodeParameter('uint256', '100000'),
            ],
          ]
        )
      );

      // Inject mocked units result 2
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              web3Instance.eth.abi.encodeParameter('uint256', '20000000'),
              web3Instance.eth.abi.encodeParameter('uint256', '400000'),
              web3Instance.eth.abi.encodeParameter('uint256', '200000'),
            ],
          ]
        )
      );

      await waitForValueToChange(
        () => result.current.offchainVotingResultsStatus
      );

      expect(result.current.offchainVotingResults).toMatchObject([]);
      expect(result.current.offchainVotingResultsError).toBe(undefined);
      expect(result.current.offchainVotingResultsStatus).toBe(
        AsyncStatus.PENDING
      );

      await waitForValueToChange(
        () => result.current.offchainVotingResultsStatus
      );

      expect(result.current.offchainVotingResults).toMatchObject([
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
          {
            No: {percentage: 1, units: 100000},
            Yes: {percentage: 2, units: 200000},
            totalUnits: 10000000,
          },
        ],
        [
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          {
            No: {percentage: 1, units: 200000},
            Yes: {percentage: 2, units: 400000},
            totalUnits: 20000000,
          },
        ],
      ]);
      expect(result.current.offchainVotingResultsError).toBe(undefined);
      expect(result.current.offchainVotingResultsStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });
  });
});
