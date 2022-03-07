import {useCallback, useEffect, useState} from 'react';
import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {useQueryClient} from 'react-query';

import {
  Proposal,
  ProposalData,
  ProposalOrDraftSnapshotType,
  SnapshotDraft,
  SnapshotProposal,
  SnapshotProposalCommon,
} from '../types';
import {AsyncStatus} from '../../../util/types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {useAbortController, useCounter} from '../../../hooks';
import {useProposalsVotingAdapter} from './useProposalsVotingAdapter';

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
 * Fetches a snapshot-hub `proposal` or `draft` type by an ID string.
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

  const [daoProposal /* setDAOProposal */] = useState<Proposal>();
  const [snapshotDraft, setSnapshotDraft] = useState<SnapshotDraft>();
  const [snapshotProposal, setSnapshotProposal] = useState<SnapshotProposal>();
  const [proposalNotFound, setProposalNotFound] = useState<boolean>(false);
  const [proposalError, setProposalError] = useState<Error>();
  const [proposalStatus, setProposalStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );
  const [proposalVotingAdapterId, setProposalVotingAdapterId] = useState<
    string[]
  >([id]);

  // The overall status of the async data being fetched
  const [proposalInclusiveStatus, setProposalInclusiveStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  // Any error of the async data being fetched
  const [proposalInclusiveError, setProposalInclusiveError] = useState<Error>();

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();

  const [refetchCount, updateRefetchCount] = useCounter();

  /**
   * Fetch on-chain voting adapter data for proposals.
   * Only returns data for proposals of which voting adapters have been assigned (i.e. sponsored).
   */
  const {
    proposalsVotingAdapters,
    proposalsVotingAdaptersError,
    proposalsVotingAdaptersStatus,
  } = useProposalsVotingAdapter(proposalVotingAdapterId);

  /**
   * Their hooks
   */

  const queryClient = useQueryClient();

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
          // idInDAO: '',
          daoProposal,
          daoProposalVotingAdapter: proposalsVotingAdapters[0]?.[1],
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
    // Required in order to refetch
    refetchCount,
    type,
  ]);

  useEffect(() => {
    if (refetchCount === 0) return;

    /**
     * Provide a different Array reference to force a re-render of the
     * `useProposalsVotingAdapter` hook. If the `id` argument changes, that's
     * fine as well, but it's unlikely.
     */
    setProposalVotingAdapterId([id]);
  }, [id, refetchCount]);

  useEffect(() => {
    async function resetQueries() {
      if (refetchCount === 0) return;

      /**
       * Reset React Queries when `refetchCount` is incremented (proposal is
       * sponsored/submitted on chain, proposal is voted on)
       *
       * Needed so queries can fetch data that has been updated by the change in
       * proposal status
       *
       */
      await queryClient.resetQueries();
    }

    resetQueries();
  }, [queryClient, refetchCount]);

  // Set overall async status
  useEffect(() => {
    const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;
    const statuses = [proposalStatus, proposalsVotingAdaptersStatus];

    /**
     * Standby
     *
     * The other statuses rely on a Snapshot Hub proposal or draft being fetched,
     * so it's only in `STANDBY` at the point the proposals have
     * not yet been fetched.
     */
    if (proposalStatus === STANDBY) {
      setProposalInclusiveStatus(STANDBY);

      return;
    }

    /**
     * Pending
     *
     * Do not trigger pending requests (UI may show loader) for refetches (meant to be silent).
     */
    if (statuses.some((s) => s === PENDING) && refetchCount === 0) {
      setProposalInclusiveStatus(PENDING);

      return;
    }

    // Fulfilled
    if (statuses.every((s) => s === FULFILLED)) {
      setProposalInclusiveStatus(FULFILLED);

      return;
    }

    // Fulfilled: checked for DAO proposals' voting adapters and none were returned - not sponsored
    if (
      proposalStatus === FULFILLED &&
      proposalsVotingAdaptersStatus === FULFILLED &&
      !proposalsVotingAdapters.length
    ) {
      setProposalInclusiveStatus(FULFILLED);

      return;
    }

    // Rejected
    if (statuses.some((s) => s === REJECTED)) {
      setProposalInclusiveStatus(REJECTED);

      return;
    }
  }, [
    proposalStatus,
    proposalsVotingAdapters.length,
    proposalsVotingAdaptersStatus,
    refetchCount,
  ]);

  // Set any error from async calls
  useEffect(() => {
    const errors = [proposalError, proposalsVotingAdaptersError];

    setProposalInclusiveError(errors.find((e) => e));
  }, [proposalError, proposalsVotingAdaptersError]);

  /**
   * Functions
   */

  async function handleGetDraft(): Promise<SnapshotDraft | undefined> {
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
      if (!isMountedRef.current) return;

      const e = error as Error;

      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(e);
    }
  }

  async function handleGetProposal(): Promise<SnapshotProposal | undefined> {
    try {
      setProposalStatus(AsyncStatus.PENDING);

      /**
       * @note `searchUniqueDraftId` includes the draft id in the search for the proposal
       *   as a Tribute proposal's ID hash could be the Snapshot Draft's ID.
       */
      const response = await fetch(
        `${SNAPSHOT_HUB_API_URL}/api/${SPACE}/proposal/${id}?searchUniqueDraftId=true&includeVotes=true`,
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
      if (!isMountedRef.current) return;

      const e = error as Error;

      setProposalStatus(AsyncStatus.REJECTED);
      setProposalError(e);
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
    proposalError: proposalInclusiveError,
    proposalNotFound,
    proposalStatus: proposalInclusiveStatus,
  };
}
