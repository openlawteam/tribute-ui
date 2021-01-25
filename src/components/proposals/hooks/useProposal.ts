import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotDraftResponse,
  SnapshotDraftResponseData,
  SnapshotProposalResponse,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {useAbortController} from '../../../hooks';

type ProposalOrDraft<
  T extends SnapshotType.proposal | SnapshotType.draft
> = T extends SnapshotType.proposal
  ? SnapshotProposalResponseData
  : SnapshotDraftResponseData;

type UseProposalReturn<T extends SnapshotType.proposal | SnapshotType.draft> = {
  proposal: ProposalOrDraft<T> | undefined;
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
export function useProposal<
  T extends SnapshotType.proposal | SnapshotType.draft
>(
  id: string,
  /**
   * @todo Remove optional once subgraph is implemented and we can determine
   *   whether or not it's been sponsored.
   */
  type?: T
): UseProposalReturn<T> {
  /**
   * State
   */

  const [proposal, setProposal] = useState<ProposalOrDraft<T>>();
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

      const responseJSON: SnapshotDraftResponse = await response.json();
      // Get the `SnapshotDraftResponseData` by the address key of the single result.
      const draft = responseJSON[Object.keys(responseJSON)[0]];

      if (!isMountedRef.current) return;

      // @note API does not provide a 404
      if (!draft || !Object.keys(draft).length) {
        setProposalNotFound(true);

        throw new Error(ERROR_PROPOSAL_NOT_FOUND);
      }

      setProposalStatus(AsyncStatus.FULFILLED);
      setProposal(draft as ProposalOrDraft<T>);

      return draft as ProposalOrDraft<T>;
    } catch (error) {
      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(error);
    }
  }

  async function handleGetProposal() {
    try {
      setProposalStatus(AsyncStatus.PENDING);

      /**
       * @note `searchUniqueDraftId` includes the draft id in the search for the proposal
       *   as a Moloch proposal's ID hash could be the Snapshot Draft's ID.
       */
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

      const responseJSON: SnapshotProposalResponse = await response.json();
      // Get the `SnapshotProposalResponseData` by the address key of the single result.
      const proposal = responseJSON[Object.keys(responseJSON)[0]];

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
      setProposal(proposal as ProposalOrDraft<T>);

      return proposal as ProposalOrDraft<T>;
    } catch (error) {
      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(error);
    }
  }

  /**
   * Searches all possible combinations to return a proposal or a draft:
   *
   * 1. Search for a proposal (including by using the `id` as the Draft's ID hash via `searchUniqueDraftId`)
   * 2. Search for a draft, if nothing is returned for a proposal.
   */
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
