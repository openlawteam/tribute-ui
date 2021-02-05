import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {
  ProposalData,
  ProposalOrDraftSnapshotType,
  SnapshotDraft,
  SnapshotProposal,
  SnapshotProposalCommon,
  SubgraphProposal,
} from '../types';
import {useAbortController, useCounter} from '../../../hooks';

type UseProposalReturn = {
  proposalData: ProposalData | undefined;
  proposalError: Error | undefined;
  proposalNotFound: boolean;
  proposalStatus: AsyncStatus;
};

const ERROR_PROPOSAL: string =
  'Something went wrong while getting the proposal.';
const ERROR_PROPOSAL_NOT_FOUND: string = 'Proposal was not found.';

/**
 * useProposalOrDraft
 *
 * Ahook which fetches a snapshot-hub `proposal` or `draft` type by an ID string.
 *
 * If no `type` argument is provided it will search first for a
 * `proposal`, then if not found, search for a `draft`.
 *
 * @todo Fetch subgraph proposal on mount before a draft or proposal has been fetched.
 *
 * @param {string} id A draft's or a proposal's ID to search for.
 * @param {SnapshotType?} type An optional snapshot-hub `type` to search by.
 * @returns {UseProposalReturn}
 */
export function useProposalOrDraft(
  id: string,
  type?: ProposalOrDraftSnapshotType
): UseProposalReturn {
  /**
   * State
   */

  /**
   * @todo Get subgraph data using useLazyQuery
   * @link https://www.apollographql.com/docs/react/data/queries/#executing-queries-manually
   */
  const [daoProposal /* setDAOProposal */] = useState<SubgraphProposal>();
  const [snapshotDraft, setSnapshotDraft] = useState<SnapshotDraft>();
  const [snapshotProposal, setSnapshotProposal] = useState<SnapshotProposal>();
  const [proposalNotFound, setProposalNotFound] = useState<boolean>(false);
  const [proposalError, setProposalError] = useState<Error>();
  const [proposalStatus, setProposalStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();
  const [refetchCount, updateRefetchCount] = useCounter();

  /**
   * Cached callbacks
   */

  const handleGetDraftCached = useCallback(handleGetDraft, [
    abortController?.signal,
    id,
    isMountedRef,
    refetchCount,
  ]);
  const handleGetProposalCached = useCallback(handleGetProposal, [
    abortController?.signal,
    id,
    isMountedRef,
    refetchCount,
    type,
  ]);
  const handleGetProposalOrDraftCached = useCallback(handleGetProposalOrDraft, [
    handleGetDraftCached,
    handleGetProposalCached,
  ]);

  /**
   * Variables
   */

  const snapshotType: ProposalOrDraftSnapshotType | undefined = snapshotProposal
    ? SnapshotType.proposal
    : snapshotDraft
    ? SnapshotType.draft
    : undefined;

  /**
   * We need to at least have Snapshot data to provide the proposal,
   * otherwise we will have nothing to show the user.
   */
  const proposalData: UseProposalReturn['proposalData'] =
    snapshotDraft || snapshotProposal
      ? {
          daoProposal,
          getCommonSnapshotProposalData,
          refetchProposalOrDraft,
          snapshotDraft,
          snapshotProposal,
          snapshotType,
        }
      : undefined;

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

  async function handleGetDraft(): Promise<SnapshotDraft | undefined> {
    try {
      // Do not trigger pending requests (UI will show loader) for refetches (meant to be silent).
      if (refetchCount === 0) setProposalStatus(AsyncStatus.PENDING);

      const response = await fetch(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/draft/${id}`,
        {signal: abortController?.signal}
      );

      if (!response.ok) {
        throw new Error(ERROR_PROPOSAL);
      }

      const responseJSON: SnapshotDraftResponse = await response.json();

      if (!isMountedRef.current) return;

      // @note API does not provide a 404
      if (!responseJSON || !Object.keys(responseJSON).length) {
        setProposalNotFound(true);

        throw new Error(ERROR_PROPOSAL_NOT_FOUND);
      }

      const idKey = Object.keys(responseJSON)[0];
      // Get the `SnapshotDraftResponseData` by the address key of the single result.
      const draft: SnapshotDraft = {
        idInDAO: idKey,
        idInSnapshot: idKey,
        ...responseJSON[idKey],
      };

      setProposalStatus(AsyncStatus.FULFILLED);
      setSnapshotDraft(draft);

      return draft;
    } catch (error) {
      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(error);
    }
  }

  async function handleGetProposal(): Promise<SnapshotProposal | undefined> {
    try {
      // Do not trigger pending requests (UI will show loader) for refetches (meant to be silent).
      if (refetchCount === 0) setProposalStatus(AsyncStatus.PENDING);

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
         */
        if (type === SnapshotType.proposal) {
          throw new Error(ERROR_PROPOSAL);
        }

        return;
      }

      const responseJSON: SnapshotProposalResponse = await response.json();

      if (!isMountedRef.current) return;

      // @note API does not provide a 404
      if (!responseJSON || !Object.keys(responseJSON).length) {
        /**
         * If `type` is set then we know we can determine `handleGetDraft`
         * will not be called after in `handleGetProposalOrDraft`.
         */
        if (type === SnapshotType.proposal) {
          setProposalNotFound(true);
          throw new Error(ERROR_PROPOSAL_NOT_FOUND);
        }

        return;
      }

      const idKey = Object.keys(responseJSON)[0];
      // Determine ID submitted to DAO, i.e. if there's a Draft ID hash, we should use that.
      const proposalId: string =
        responseJSON[idKey]?.data.erc712DraftHash || idKey;
      // Get the `SnapshotProposalResponseData` by the address key of the single result.
      const proposal: SnapshotProposal = {
        idInDAO: proposalId,
        idInSnapshot: idKey,
        ...responseJSON[idKey],
      };

      setProposalStatus(AsyncStatus.FULFILLED);
      setSnapshotProposal(proposal);

      return proposal;
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
      // 2. If not found, attempt a search for a draft.
      const draft = await handleGetDraftCached();

      setSnapshotDraft(draft);

      return;
    }

    setSnapshotProposal(proposal);
  }

  /**
   * getCommonSnapshotProposalData
   *
   * @returns `SnapshotProposalCommon | undefined` Data for either a Draft or Proposal which is shared between the two types.
   */
  function getCommonSnapshotProposalData(): SnapshotProposalCommon | undefined {
    switch (snapshotType) {
      case SnapshotType.draft:
        return snapshotDraft;
      case SnapshotType.proposal:
        return snapshotProposal;
      default:
        return undefined;
    }
  }

  function refetchProposalOrDraft(): void {
    updateRefetchCount({type: 'increment'});
  }

  return {
    proposalData,
    proposalError,
    proposalNotFound,
    proposalStatus,
  };
}
