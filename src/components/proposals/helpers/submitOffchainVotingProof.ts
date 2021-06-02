import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {ToStepNodeResult} from '@openlaw/snapshot-js-erc712/dist/types';

type SubmitOffchainVotingProofArguments = {
  /**
   * DAO Adapter address
   */
  actionId: string;
  /**
   * Blockchain network ID
   */
  chainId: number;
  /**
   * Hex string of the Merkle root
   */
  merkleRoot: string;
  /**
   * An array of Merkle tree steps
   */
  steps: ToStepNodeResult[];
  /**
   * DAO Registry address
   */
  verifyingContract: string;
};

/**
 * submitOffchainVotingProof
 *
 * Submits a Merkle hex root and its steps to Snapshot Hub
 * for verification and storage (if successful).
 *
 * The API endpoint does not have any return data, only a `201` response.
 *
 * @link https://github.com/openlawteam/snapshot-hub
 */
export async function submitOffchainVotingProof(
  data: SubmitOffchainVotingProofArguments
): Promise<void> {
  try {
    const response = await fetch(
      `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(
        'Something went wrong while submitting the off-chain vote proof.'
      );
    }
  } catch (error) {
    throw error;
  }
}
