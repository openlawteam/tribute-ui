import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {submitOffchainVotingProof} from './';

describe('submitOffchainVotingProof unit tests', () => {
  test('can call `submitOffchainVotingProof` and return OK', async () => {
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

  test('`submitOffchainVotingProof` JSON `body` is OK', async () => {
    let requestBody: any;

    // Override default mock as we want access to the `req.body`.
    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
        (req, res, ctx) => {
          requestBody = req.body;

          return res(ctx.status(201));
        }
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
    expect(requestBody).toStrictEqual({
      actionId: '',
      chainId: 1337,
      merkleRoot: '',
      steps: [],
      verifyingContract: '',
    });
  });

  test('can throw error when server error', async () => {
    server.use(
      rest.post(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
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
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
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
