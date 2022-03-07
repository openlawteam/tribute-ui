import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotProposalResponse,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {useQuery} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {ProposalData} from '../../proposals/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {useIsMounted} from '../../../hooks';

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
  const [governanceProposalsError, setGovernanceProposalsError] =
    useState<Error>();
  const [governanceProposalsStatus, setGovernanceProposalsStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  /**
   * Our hooks
   */

  const {isMountedRef} = useIsMounted();

  /**
   * React Query
   */

  const {
    data: snapshotProposalEntriesData,
    error: snapshotProposalEntriesError,
  } = useQuery(
    ['snapshotProposalEntries', actionId],
    async () => await getSnapshotProposalsByActionId(actionId),
    {
      enabled: !!actionId,
    }
  );

  /**
   * Cached callbacks
   */

  const handleGetProposalsCached = useCallback(handleGetProposals, [
    isMountedRef,
    snapshotProposalEntriesData,
    snapshotProposalEntriesError,
  ]);

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

      if (snapshotProposalEntriesError) {
        throw snapshotProposalEntriesError;
      }

      if (snapshotProposalEntriesData) {
        if (!isMountedRef.current) return;

        setGovernanceProposalsStatus(AsyncStatus.FULFILLED);
        setGovernanceProposals(snapshotProposalEntriesData);
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      const e = error as Error;

      setGovernanceProposalsStatus(AsyncStatus.REJECTED);
      setGovernanceProposals([]);
      setGovernanceProposalsError(e);
    }
  }

  return {
    governanceProposals,
    governanceProposalsError,
    governanceProposalsStatus,
  };
}
