import {getOffchainVotingProof} from './';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';

describe('getOffchainVotingProof unit tests', () => {
  test('can throw error when server error', async () => {
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await getOffchainVotingProof('abc123');
    } catch (error) {
      testError = error;
    }

    expect(testError?.message).toMatch(
      /something went wrong while getting the off-chain vote proof\./i
    );
  });

  test('can throw error when client error', async () => {
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(400))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await getOffchainVotingProof('abc123');
    } catch (error) {
      testError = error;
    }

    expect(testError?.message).toMatch(
      /something went wrong while getting the off-chain vote proof\./i
    );
  });
});
