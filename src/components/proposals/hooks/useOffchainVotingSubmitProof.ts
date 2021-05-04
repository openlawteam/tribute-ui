import {useState} from 'react';

import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {AsyncStatus} from '../../../util/types';

type UseOffchainVotingSubmitProofReturn = {
  offchainVotingSubmitProofError: Error | undefined;
  offchainVotingSubmitProofStatus: AsyncStatus;
  /**
   * An async function which will submit the provided merkle root and steps
   * to Snapshot Hub.
   *
   * @todo Types for args.
   */
  offchainVotingSubmitProof: (merkleRoot: any, steps: any) => Promise<void>;
};

/**
 * useOffchainVotingSubmitProof
 *
 * Submits a Merkle hex root and its steps to Snapshot Hub
 * for verification and storage (if successful).
 *
 * @link https://github.com/openlawteam/snapshot-hub
 */
export function useOffchainVotingSubmitProof(): UseOffchainVotingSubmitProofReturn {
  /**
   * State
   */

  const [
    offchainVotingSubmitProofError,
    setOffchainVotingSubmitProofError,
  ] = useState<Error>();

  const [
    offchainVotingSubmitProofStatus,
    setOffchainVotingSubmitProofStatus,
  ] = useState<AsyncStatus>(AsyncStatus.STANDBY);

  /**
   * Functions
   */

  async function submitProof() {
    try {
      /* 
        req.body.verifyingContract;
        req.body.actionId;
        req.body.chainId;
        req.body.merkleRoot;
        req.body.steps; */

      return await fetch(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/offchain_proofs`,
        {method: 'POST', body: JSON.stringify({})}
      );
    } catch (error) {
      throw error;
    }
  }

  async function handleOffchainVotingSubmitProof() {
    try {
      setOffchainVotingSubmitProofStatus(AsyncStatus.PENDING);

      await submitProof();

      setOffchainVotingSubmitProofStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setOffchainVotingSubmitProofError(error);
      setOffchainVotingSubmitProofStatus(AsyncStatus.REJECTED);
    }
  }

  return {
    offchainVotingSubmitProof: handleOffchainVotingSubmitProof,
    offchainVotingSubmitProofError,
    offchainVotingSubmitProofStatus,
  };
}
