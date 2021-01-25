import {
  SnapshotDraftResponseData,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

// @todo Change the type to be precise
export type SubgraphProposal = Record<string, any>;

export type ProposalCombined<T extends ProposalOrDraftSnapshotData> = {
  snapshotProposal: T;
  subgraphProposal: SubgraphProposal;
};

/**
 * A conditional helper type for determining which data shape to use.
 *
 * @link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
export type ProposalOrDraftSnapshotData =
  | SnapshotDraftResponseData
  | SnapshotProposalResponseData;

export type ProposalOrDraft<
  T extends ProposalOrDraftSnapshotData
> = T extends SnapshotProposalResponseData
  ? SnapshotProposalResponseData
  : SnapshotDraftResponseData;

/**
 * A conditional helper type for determining which data shape to use based on the `ProposalOrDraftSnapshotType`.
 *
 * @link https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 */
export type ProposalOrDraftSnapshotType =
  | SnapshotType.proposal
  | SnapshotType.draft;

export type ProposalOrDraftFromType<
  T extends ProposalOrDraftSnapshotType
> = T extends SnapshotType.proposal
  ? SnapshotProposalResponseData
  : SnapshotDraftResponseData;
