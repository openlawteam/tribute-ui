import {waitFor} from '@testing-library/react';

import {getOffchainVotingProof} from './';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {SnapshotOffchainProofResponse} from '../voting/types';
import {snapshotAPIOffchainProofResponse} from '../../../test/restResponses';

const DEFAULT_MERKLE_ROOT_HEX: string =
  '0x2f6a1ec9f67c87e7956228a0838b0980748f2dda936a0ebaf3e929f192fa7b6c';

describe('getOffchainVotingProof unit tests', () => {
  test('can fetch proof', async () => {
    let testResponse: SnapshotOffchainProofResponse | undefined;
    let testError: Error;

    try {
      testResponse = await getOffchainVotingProof(DEFAULT_MERKLE_ROOT_HEX);
    } catch (error) {
      testError = error;
    }

    await waitFor(async () => {
      expect(testResponse).toMatchObject(snapshotAPIOffchainProofResponse);
      expect(testError).toBe(undefined);
    });
  });

  test('can return "undefined" if no proof exists', async () => {
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(404))
      )
    );

    let testResponse: SnapshotOffchainProofResponse | undefined;
    let testError: Error;

    try {
      testResponse = await getOffchainVotingProof(DEFAULT_MERKLE_ROOT_HEX);
    } catch (error) {
      testError = error;
    }

    await waitFor(async () => {
      expect(testResponse).toBe(undefined);
      expect(testError).toBe(undefined);
    });
  });

  test('can throw error when server error', async () => {
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

    let testError: any;

    try {
      await getOffchainVotingProof(DEFAULT_MERKLE_ROOT_HEX);
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
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
        (_req, res, ctx) => res(ctx.status(400))
      )
    );

    let testError: any;

    try {
      // Using fake data
      await getOffchainVotingProof(DEFAULT_MERKLE_ROOT_HEX);
    } catch (error) {
      testError = error;
    }

    expect(testError?.message).toMatch(
      /something went wrong while getting the off-chain vote proof\./i
    );
  });
});
