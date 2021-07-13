import {SnapshotType, VoteChoicesIndex} from '@openlaw/snapshot-js-erc712';

import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {getVoteChosen} from './getVoteChosen';
import {SnapshotProposal} from '../types';
import {VoteChoices} from '../../web3/types';

describe('getVoteChosen unit tests', () => {
  test('should return undefined when no votes', async () => {
    const voteChosen = getVoteChosen([], DEFAULT_ETH_ADDRESS);

    expect(voteChosen).toBeUndefined();
  });

  test('should return undefined when votes undefined', async () => {
    const voteChosen = getVoteChosen(undefined, DEFAULT_ETH_ADDRESS);

    expect(voteChosen).toBeUndefined();
  });

  test('should return `VoteChoices.Yes`', async () => {
    const votes: SnapshotProposal['votes'] = [
      {
        [DEFAULT_ETH_ADDRESS]: {
          address: DEFAULT_ETH_ADDRESS,
          msg: {
            payload: {
              proposalId: '',
              choice: VoteChoicesIndex.Yes,
              metadata: {
                memberAddress: DEFAULT_ETH_ADDRESS,
              },
            },
            version: '',
            timestamp: '',
            token: '',
            type: SnapshotType.vote,
          },
          sig: '',
          authorIpfsHash: '',
          relayerIpfsHash: '',
          actionId: '',
        },
      },
    ];

    const voteChosen = getVoteChosen(votes, DEFAULT_ETH_ADDRESS);

    expect(voteChosen).toBe(VoteChoices.Yes);
  });

  test('should return `VoteChoices.No`', async () => {
    const votes: SnapshotProposal['votes'] = [
      {
        [DEFAULT_ETH_ADDRESS]: {
          address: DEFAULT_ETH_ADDRESS,
          msg: {
            payload: {
              proposalId: '',
              choice: VoteChoicesIndex.No,
              metadata: {
                memberAddress: DEFAULT_ETH_ADDRESS,
              },
            },
            version: '',
            timestamp: '',
            token: '',
            type: SnapshotType.vote,
          },
          sig: '',
          authorIpfsHash: '',
          relayerIpfsHash: '',
          actionId: '',
        },
      },
    ];

    const voteChosen = getVoteChosen(votes, DEFAULT_ETH_ADDRESS);

    expect(voteChosen).toBe(VoteChoices.No);
  });

  test('should return undefined when account did not vote', async () => {
    const votes: SnapshotProposal['votes'] = [
      {
        [DEFAULT_ETH_ADDRESS]: {
          address: DEFAULT_ETH_ADDRESS,
          msg: {
            payload: {
              proposalId: '',
              choice: VoteChoicesIndex.No,
              metadata: {
                memberAddress: DEFAULT_ETH_ADDRESS,
              },
            },
            version: '',
            timestamp: '',
            token: '',
            type: SnapshotType.vote,
          },
          sig: '',
          authorIpfsHash: '',
          relayerIpfsHash: '',
          actionId: '',
        },
      },
    ];

    const voteChosen = getVoteChosen(
      votes,
      '0xc3C966D3B7b085d0fF936ed772Ac38b2A347836F'
    );

    expect(voteChosen).toBeUndefined();
  });
});
