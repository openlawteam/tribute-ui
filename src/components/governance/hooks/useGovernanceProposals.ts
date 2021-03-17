import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotProposalResponse,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {ProposalData} from '../../proposals/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';

type UseGovernanceProposalsReturn = {
  governanceProposals: ProposalData[];
  governanceProposalsStatus: AsyncStatus;
  governanceProposalsError: Error | undefined;
};

/**
 * useGovernanceProposals
 *
 * Provides an array of id->proposal tuples of governance-style proposals which are not submitted on-chain.
 *
 * @param {{actionId : string}}
 *   - `actionId`: Name of the ERC-712 `actionId` to get Governance proposals by. Defaults to `BURN_ADDRESS`.
 * @returns `UseGovernanceProposalsReturn` An object with the governance proposals, and the current async status.
 */
export function useGovernanceProposals({
  actionId = BURN_ADDRESS,
}: {
  actionId?: string;
}): UseGovernanceProposalsReturn {
  /**
   * State
   */

  const [governanceProposals, setGovernanceProposals] = useState<
    ProposalData[]
  >([]);
  const [
    governanceProposalsError,
    setGovernanceProposalsError,
  ] = useState<Error>();
  const [
    governanceProposalsStatus,
    setGovernanceProposalsStatus,
  ] = useState<AsyncStatus>(AsyncStatus.STANDBY);

  /**
   * Cached callbacks
   */

  const handleGetProposalsCached = useCallback(handleGetProposals, [actionId]);

  /**
   * Effects
   */

  useEffect(() => {
    handleGetProposalsCached();
  }, [handleGetProposalsCached]);

  /**
   * Functions
   */

  /**
   * Gets Proposals from Snapshot Hub
   */
  async function getSnapshotProposalsByActionId(
    actionId: string
  ): Promise<ProposalData[]> {
    try {
      const baseURL = `${SNAPSHOT_HUB_API_URL}/api/${SPACE}`;

      const proposals = await fetch(
        `${baseURL}/proposals/${actionId}?includeVotes=true`
      );

      if (!proposals.ok) {
        throw new Error(
          'Something went wrong while fetching the Snapshot proposals.'
        );
      }

      const proposalsJSON: SnapshotProposalResponse = await proposals.json();

      /**
       * @note The id of the proposal is used and we do not consider any Draft id,
       *   as we do for Snapshot->on-chain proposals.
       *
       * @todo Fix type of return so we don't need to add so many empty key/value pairs.
       */
      return Object.entries(proposalsJSON).map(
        ([id, snapshotProposal]): ProposalData => ({
          daoProposal: undefined,
          snapshotDraft: undefined,
          snapshotProposal: {
            ...snapshotProposal,
            idInSnapshot: id,
            idInDAO: '',
          },
          getCommonSnapshotProposalData: () => undefined,
          refetchProposalOrDraft: () => undefined,
          snapshotType: SnapshotType.proposal,
        })
      );
    } catch (error) {
      throw error;
    }
  }

  async function handleGetProposals() {
    try {
      setGovernanceProposalsStatus(AsyncStatus.PENDING);

      const snapshotProposalEntries = await getSnapshotProposalsByActionId(
        actionId
      );

      setGovernanceProposalsStatus(AsyncStatus.FULFILLED);
      setGovernanceProposals(snapshotProposalEntries);
    } catch (error) {
      setGovernanceProposalsStatus(AsyncStatus.REJECTED);
      setGovernanceProposals([]);
      setGovernanceProposalsError(error);
    }
  }

  return {
    governanceProposals,
    governanceProposalsError,
    governanceProposalsStatus,
  };
}
