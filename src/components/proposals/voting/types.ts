import {ToStepNodeResult} from '@openlaw/snapshot-js-erc712/dist/types';

/**
 * @see `IVoting.sol` in tribute-contracts
 */
export enum VotingState {
  NOT_STARTED,
  TIE,
  PASS,
  NOT_PASS,
  IN_PROGRESS,
  GRACE_PERIOD,
}

/**
 * @see `OffchainVoting.sol->getBadNodeError` in tribute-contracts
 */
export enum BadNodeError {
  OK,
  WRONG_PROPOSAL_ID,
  INVALID_CHOICE,
  AFTER_VOTING_PERIOD,
  BAD_SIGNATURE,
  INDEX_OUT_OF_BOUND,
}

/**
 * Response when calling `GET snapshot-hub/api/:space/offchain_proof/:merkle_root`
 */
export type SnapshotOffchainProofResponse = {
  merkle_root: string;
  space: string;
  steps: ToStepNodeResult[];
};
