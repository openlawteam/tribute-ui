import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotCoreProposalData,
  SnapshotCoreProposalPayloadData,
  SnapshotProposalPayloadData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {useAbortController} from '../../../hooks';

type UseProposalProposalData = SnapshotCoreProposalData & {
  payload: SnapshotCoreProposalPayloadData & {
    /**
     * `end` will only be returned for `proposal` types
     */
    end?: SnapshotProposalPayloadData['end'];
    /**
     * `snapshot` will only be returned for `proposal` types
     */
    snapshot?: SnapshotProposalPayloadData['snapshot'];
    /**
     * `start` will only be returned for `proposal` types
     */
    start?: SnapshotProposalPayloadData['start'];
  };
};

type UseProposalReturn = {
  proposal: UseProposalProposalData | undefined;
  proposalError: Error | undefined;
  proposalNotFound: boolean;
  proposalStatus: AsyncStatus;
};

const ERROR_PROPOSAL: string =
  'Something went wrong while getting the proposal.';
const ERROR_PROPOSAL_NOT_FOUND: string = 'Proposal was not found.';

/**
 * useProposal
 *
 * Ahook which fetches a snapshot-hub `proposal` or `draft` type by an ID string.
 *
 * If no `type` argument is provided it will search first for a
 * `proposal`, then if not found, search for a `draft`.
 *
 * @param {string} id A draft's or a proposal's ID to search for.
 * @param {SnapshotType?} type An optional snapshot-hub `type` to search by.
 * @returns {UseProposalReturn}
 */
export function useProposal(
  id: string,
  /**
   * @todo Remove optional once subgraph is implemented and we can determine
   *   whether or not it's been sponsored.
   */
  type?: SnapshotType
): UseProposalReturn {
  /**
   * State
   */

  const [proposal, setProposal] = useState<UseProposalProposalData>();
  const [proposalNotFound, setProposalNotFound] = useState<boolean>(false);
  const [proposalError, setProposalError] = useState<Error>();
  const [proposalStatus, setProposalStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();

  /**
   * Cached callbacks
   */

  const handleGetDraftCached = useCallback(handleGetDraft, [
    abortController?.signal,
    id,
    isMountedRef,
  ]);
  const handleGetProposalCached = useCallback(handleGetProposal, [
    abortController?.signal,
    id,
    isMountedRef,
    type,
  ]);
  const handleGetProposalOrDraftCached = useCallback(handleGetProposalOrDraft, [
    handleGetDraftCached,
    handleGetProposalCached,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (!abortController?.signal) return;

    switch (type) {
      case SnapshotType.draft:
        handleGetDraftCached();
        break;
      case SnapshotType.proposal:
        handleGetProposalCached();
        break;
      default:
        handleGetProposalOrDraftCached();
        break;
    }
  }, [
    abortController?.signal,
    handleGetDraftCached,
    handleGetProposalCached,
    handleGetProposalOrDraftCached,
    type,
  ]);

  /**
   * Functions
   */

  async function handleGetDraft() {
    try {
      setProposalStatus(AsyncStatus.PENDING);

      const response = await fetch(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/draft/${id}`,
        {signal: abortController?.signal}
      );

      if (!response.ok) {
        throw new Error(ERROR_PROPOSAL);
      }

      const draft = await response.json();

      if (!isMountedRef.current) return;

      // @note API does not provide a 404
      if (!draft || !Object.keys(draft).length) {
        setProposalNotFound(true);

        throw new Error(ERROR_PROPOSAL_NOT_FOUND);
      }

      setProposalStatus(AsyncStatus.FULFILLED);
      setProposal(draft);

      return draft;
    } catch (error) {
      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(error);
    }
  }

  async function handleGetProposal() {
    try {
      setProposalStatus(AsyncStatus.PENDING);

      const response = await fetch(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/proposal/${id}?searchUniqueDraftId=true`,
        {signal: abortController?.signal}
      );

      if (!response.ok) {
        /**
         * If `type` is set then we know we can determine `handleGetDraft`
         * will not be called after in `handleGetProposalOrDraft`.
         *
         * @todo Remove check once subgraph is implemented and we can detect if sponsored.
         */
        if (type === SnapshotType.proposal) {
          throw new Error(ERROR_PROPOSAL);
        }

        return;
      }

      const proposal = await response.json();

      if (!isMountedRef.current) return;

      // @note API does not provide a 404
      if (!proposal || !Object.keys(proposal).length) {
        /**
         * If `type` is set then we know we can determine `handleGetDraft`
         * will not be called after in `handleGetProposalOrDraft`.
         *
         * @todo Remove check once subgraph is implemented and we can detect if sponsored.
         */
        if (type === SnapshotType.proposal) {
          setProposalNotFound(true);
          throw new Error(ERROR_PROPOSAL_NOT_FOUND);
        }

        return;
      }

      setProposalStatus(AsyncStatus.FULFILLED);
      setProposal(proposal);

      return proposal;
    } catch (error) {
      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(error);
    }
  }

  async function handleGetProposalOrDraft() {
    // 1. Attempt to search for a proposal.
    const proposal = await handleGetProposalCached();

    if (!proposal) {
      // 2. If not found. attempt a search for a draft.
      const draft = await handleGetDraftCached();

      setProposal(draft);

      return;
    }

    setProposal(proposal);
  }

  return {
    proposal,
    proposalError,
    proposalNotFound,
    proposalStatus,
  };
}
