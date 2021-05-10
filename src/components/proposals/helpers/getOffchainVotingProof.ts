import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';

/**
 * getOffchainVotingProof
 *
 * Gets a Merkle hex root's steps from Snapshot Hub
 * for verification.
 *
 * @link https://github.com/openlawteam/snapshot-hub
 */
export async function getOffchainVotingProof(
  merkleRootHex: string
): Promise<any> {
  try {
    const response = await fetch(
      `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs/${merkleRootHex}`
    );

    if (!response.ok) {
      throw new Error(
        'Something went wrong while getting the off-chain vote proof.'
      );
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
