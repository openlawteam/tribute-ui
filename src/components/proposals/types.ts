import {
  SnapshotDraftData,
  SnapshotProposalData,
  SnapshotDraftResponseData,
  SnapshotProposalResponseData,
  SnapshotType,
  VoteChoices,
} from '@openlaw/snapshot-js-erc712';
import {AbiItem} from 'web3-utils/types';
import {Contract} from 'web3-eth-contract/types';

import {ContractAdapterNames} from '../web3/types';
import {VotingAdapterName} from '../adapters-extensions/enums';
import {VotingState} from './voting/types';

/**
 * ENUMS
 */

/**
 * Mapping of DaoRegistry proposal flags.
 * This should match the enum (including order) in the `DaoRegistry`. If it does not match,
 * the results of checking the proposal's state via flag will be wrong.
 *
 * @see `ProposalFlag` `DaoRegistry.sol`
 * @see `getFlag` `DaoConstants.sol`
 * @see `setFlag` `DaoConstants.sol`
 */
export enum ProposalFlag {
  EXISTS,
  SPONSORED,
  PROCESSED,
}

// @todo Need more information about the vote challenge flow.
export enum ProposalFlowStatus {
  Submit = 'Submit',
  Sponsor = 'Sponsor',
  OffchainVoting = 'OffchainVoting',
  OffchainVotingSubmitResult = 'OffchainVotingSubmitResult',
  OffchainVotingGracePeriod = 'OffchainVotingGracePeriod',
  OnchainVoting = 'OnchainVoting',
  Process = 'Process',
  Completed = 'Completed',
}

/**
 * @see `Distribute.sol` in tribute-contracts
 */
export enum DistributionStatus {
  NOT_STARTED,
  IN_PROGRESS,
  DONE,
  FAILED,
}

/**
 * This is an internal type we use for sending to Snapshot Hub via
 * `metadata: {}` to indicate the proposal is only meant for xyz.
 *
 * @note Only set the `metadata.type` in the case where the proposal's usage
 * cannot be determined by the `actionId` (adapter address) alone.
 */
export enum SnapshotMetadataType {
  Governance = 'Governance',
}

/**
 * TYPES
 */

export type Proposal = {
  adapterAddress: string;
  flags: string; // unint256 of Proposal's current flag
};

// Arguments for an optional render prop for `<ProposalActions />` and its child action wrapping components.
export type RenderActionPropArguments = {
  [VotingAdapterName.OffchainVotingContract]: {
    adapterName: ContractAdapterNames;
    // An enum name (`string`) of the DAO proposal's `VotingState` index
    daoProposalVoteResult: typeof VotingState[any] | undefined;
    daoProposalVote: OffchainVotingAdapterVote | undefined;
    gracePeriodStartMs: number | undefined;
    gracePeriodEndMs: number | undefined;
    proposal: ProposalData;
    status: ProposalFlowStatus | undefined;
  };
};

// @todo Change the type to be precise
export type SubgraphProposal = Record<string, any>;

/**
 * We augment the response data to add a few helpful data pieces.
 */
export type SnapshotDraft = {
  /**
   * The ID used to reference the DAO.
   */
  idInDAO: string;
  /**
   * An ID helper to reference the Draft hash
   */
  idInSnapshot: string;
} & SnapshotDraftResponseData;

/**
 * We augment the response data to add a few helpful data pieces.
 */
export type SnapshotProposal = {
  /**
   * The ID used to reference the DAO.
   */
  idInDAO: string;
  /**
   * An ID helper to reference the Proposal hash
   */
  idInSnapshot: string;
} & SnapshotProposalResponseData;

/**
 * Common data shared between a Snapshot Drafts and Proposals.
 * Helpful when we need to display information which is accessible on both.
 */
export type SnapshotProposalCommon = SnapshotDraft | SnapshotProposal;

export type ProposalData = {
  // @todo Make non-nullable?
  idInDAO?: string;
  // @todo Make non-nullable?
  daoProposalVotingAdapter?: ProposalVotingAdapterData;
  // @todo Make non-nullable?
  daoProposalVote?: ProposalVotesData;
  // @todo Make non-nullable?
  daoProposalVotingState?: VotingState;
  daoProposal: Proposal | undefined;
  /**
   * Data for either a Draft or Proposal which is shared between the two types.
   */
  getCommonSnapshotProposalData: () => SnapshotProposalCommon | undefined;
  refetchProposalOrDraft: () => void;
  snapshotDraft: SnapshotDraft | undefined;
  snapshotProposal: SnapshotProposal | undefined;
  snapshotType: ProposalOrDraftSnapshotType | undefined;
};

/**
 * A conditional helper type for determining which data shape to use.
 *
 * @link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
export type ProposalOrDraftSnapshotData =
  | SnapshotDraftResponseData
  | SnapshotProposalResponseData;

export type ProposalOrDraftSnapshotType =
  | SnapshotType.proposal
  | SnapshotType.draft;

/**
 * A conditional helper type for determining which data shape to use based on the `ProposalOrDraftSnapshotType`.
 *
 * @link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
export type ProposalOrDraftSignDataFromType<
  T extends ProposalOrDraftSnapshotType
> = T extends SnapshotType.proposal ? SnapshotProposalData : SnapshotDraftData;

/**
 * Voting.sol->Voting
 *
 * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting/Voting.sol
 */
export type VotingAdapterVotes = {
  blockNumber: string;
  nbNo: string;
  nbYes: string;
  startingTime: string;
};

/**
 * OffchainVoting.sol->Voting
 *
 * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting/OffchainVoting.sol
 */
export type OffchainVotingAdapterVote = {
  fallbackVotesCount: string;
  forceFailed: boolean;
  gracePeriodStartingTime: string;
  index: string;
  isChallenged: boolean;
  nbNo: string;
  nbYes: string;
  reporter: string;
  resultRoot: string;
  snapshot: string;
  startingTime: string;
};

/**
 * VotingResult
 *
 * A custom result we build to deliver to components.
 * It should accommodate all types of yes/no voting (i.e. on-chain, off-chain).
 */

export type VoteChoiceResult = {
  percentage: number;
  units: number;
};

export type VotingResult = {
  [VoteChoices.Yes]: VoteChoiceResult;
  [VoteChoices.No]: VoteChoiceResult;
  totalUnits: number;
};

/**
 * Proposal's voting adapter data
 */
export type ProposalVotingAdapterData = {
  votingAdapterName: VotingAdapterName;
  votingAdapterAddress: string;
  /**
   * Get the ABI for the proposal.
   * The object is not included inline to
   * save from repetitive data (some ABIs can be large).
   */
  getVotingAdapterABI: () => AbiItem[];
  // Helper to use the Web3 Contract directly
  getWeb3VotingAdapterContract: <T = Contract>() => T;
};

export type ProposalVotingAdapterTuple = [
  proposalId: string,
  votingAdapterData: ProposalVotingAdapterData
];

/**
 * Proposal on-chain votes data
 *
 * @see `useProposalsVotes`
 */
export type ProposalVotesData = {
  [VotingAdapterName.OffchainVotingContract]?: OffchainVotingAdapterVote;
  [VotingAdapterName.VotingContract]?: VotingAdapterVotes;
};
