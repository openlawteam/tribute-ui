import {
  SnapshotDraftData,
  SnapshotProposalData,
  SnapshotDraftResponseData,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

/**
 * ENUMS
 */

/**
 * Reverse mapping of DaoRegistry proposal flags.
 * The formula used to create the `flags` entry is:
 *   `prevFlags + 2**nextFlagIndex`
 *    i.e. to get the flag after `flags: 1` the formula is: `1 + 2**1 = 3`
 *
 * @note Order matters
 *
 * @see `ProposalFlag` in laoland `DaoRegistry.sol`
 * @see `getFlag` in laoland `DaoConstants.sol`
 * @see `setFlag` in laoland `DaoConstants.sol`
 */
export enum ProposalFlag {
  EXISTS = 1,
  SPONSORED = 3,
  PROCESSED = 7,
}

// @todo Need more information about the vote challenge flow.
export enum ProposalFlowStatus {
  Sponsor = 'Sponsor',
  OffchainVoting = 'OffchainVoting',
  OffchainVotingSubmitResult = 'OffchainVotingSubmitResult',
  OffchainVotingGracePeriod = 'OffchainVotingGracePeriod',
  OnchainVoting = 'OnchainVoting',
  Process = 'Process',
  Completed = 'Completed',
}

/**
 * @see `Distribute.sol` in molochv3-contracts
 */
export enum DistributionStatus {
  NOT_STARTED,
  IN_PROGRESS,
  DONE,
  FAILED,
}

/**
 * TYPES
 */

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
  daoProposal: SubgraphProposal | undefined;
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
