import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {submitOffchainVotingProof} from './';

describe('submitOffchainVotingProof unit tests', () => {
  test('can call `submitOffchainVotingProof` and return OK', async () => {
    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs`,
        (_req, res, ctx) => res(ctx.status(201))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await submitOffchainVotingProof({
        verifyingContract: '',
        actionId: '',
        merkleRoot: '',
        steps: [],
        chainId: 1337,
      });
    } catch (error) {
      testError = error;
    }

    expect(testError).toBe(undefined);
  });

  test('can throw error when server error', async () => {
    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs`,
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await submitOffchainVotingProof({
        verifyingContract: '',
        actionId: '',
        merkleRoot: '',
        steps: [],
        chainId: 1337,
      });
    } catch (error) {
      testError = error;
    }

    expect(testError?.message).toMatch(
      /something went wrong while submitting the off-chain vote proof\./i
    );
  });

  test('can throw error when client error', async () => {
    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs`,
        (_req, res, ctx) => res(ctx.status(400))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await submitOffchainVotingProof({
        verifyingContract: '',
        actionId: '',
        merkleRoot: '',
        steps: [],
        chainId: 1337,
      });
    } catch (error) {
      testError = error;
    }

    expect(testError?.message).toMatch(
      /something went wrong while submitting the off-chain vote proof\./i
    );
  });
});
