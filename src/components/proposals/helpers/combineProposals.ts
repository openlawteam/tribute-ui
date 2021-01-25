import {
  ProposalCombined,
  ProposalOrDraftSnapshotData,
  SubgraphProposal,
} from '../types';

/**
 * Provides a combined data structure for displaying information about a proposal,
 * ensuring the types are correct.
 *
 * @param {ProposalOrDraft<T>} snapshotProposal
 * @param {SubgraphProposal} subgraphProposal
 * @returns {ProposalCombined<T extends ProposalOrDraftSnapshotType>}
 */
export function combineProposals<T extends ProposalOrDraftSnapshotData>(
  snapshotProposal: T | undefined,
  subgraphProposal: SubgraphProposal | undefined
): ProposalCombined<T> | undefined {
  if (!snapshotProposal || !subgraphProposal) return;

  return {
    snapshotProposal,
    subgraphProposal,
  };
}
