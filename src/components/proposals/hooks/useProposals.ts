import {useEffect, useMemo, useState, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {
  SnapshotDraftResponse,
  SnapshotDraftResponseData,
  SnapshotProposalResponse,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {useQueryClient} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {DaoAdapterConstants} from '../../adapters-extensions/enums';
import {normalizeString} from '../../../util/helpers';
import {ProposalData, SnapshotDraft, SnapshotProposal} from '../types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {StoreState} from '../../../store/types';
import {useDaoProposals, useProposalsVotingState} from '.';
import {useProposalsVotes} from './useProposalsVotes';
import {useProposalsVotingAdapter} from './useProposalsVotingAdapter';

type UseProposalsReturn = {
  proposals: ProposalData[];
  proposalsStatus: AsyncStatus;
  proposalsError: Error | undefined;
};

type SnapshotDraftAndProposalEntries = [
  string,
  SnapshotDraftResponseData | SnapshotProposalResponseData
][];

const INITIAL_ARRAY: any[] = [];

// Gets Drafts (unsponsored Proposals) from Snapshot Hub
async function getSnapshotDraftsByAdapterAddress(
  adapterAddress: string
): Promise<[string, SnapshotDraftResponseData][]> {
  try {
    const baseURL = `${SNAPSHOT_HUB_API_URL}/api/${SPACE}`;

    const drafts = await fetch(`${baseURL}/drafts/${adapterAddress}`);

    if (!drafts.ok) {
      throw new Error(
        'Something went wrong while fetching the Snapshot drafts.'
      );
    }

    const draftsJSON: SnapshotDraftResponse = await drafts.json();

    // Get Drafts which have not yet been sponsored (Proposal created)
    const draftEntries = Object.entries(draftsJSON).filter(
      ([_, d]) => d.data.sponsored === false
    );

    return draftEntries;
  } catch (error) {
    throw error;
  }
}

// Gets Proposals from Snapshot Hub
async function getSnapshotProposalsByAdapterAddress(
  adapterAddress: string
): Promise<[string, SnapshotProposalResponseData][]> {
  try {
    const baseURL = `${SNAPSHOT_HUB_API_URL}/api/${SPACE}`;

    const proposals = await fetch(
      `${baseURL}/proposals/${adapterAddress}?includeVotes=true`
    );

    if (!proposals.ok) {
      throw new Error(
        'Something went wrong while fetching the Snapshot proposals.'
      );
    }

    const proposalsJSON: SnapshotProposalResponse = await proposals.json();

    /**
     * Re-map entries setting the correct id used for the `proposalId` in the DAO.
     * If it has a draft hash, then this is what was submitted to the DAO, most likely (e.g. submit proposal)
     */
    const proposalEntries = Object.entries(proposalsJSON).map(
      ([id, p]): [string, SnapshotProposalResponseData] => [
        p.data.erc712DraftHash || id,
        p,
      ]
    );

    return proposalEntries;
  } catch (error) {
    throw error;
  }
}

/**
 * useProposals
 *
 * @param {string} adapterName Name of the adapter contract to get proposals for.
 * @param {string} includeProposalsExistingOnlyOffchain To handle proposal types where the first step is creating a snapshot draft/offchain proposal only (no onchain proposal exists).
 * @returns `UseProposalsReturn` An object with the proposals, and the current async status.
 */
export function useProposals({
  adapterName,
  includeProposalsExistingOnlyOffchain = false,
}: {
  adapterName: DaoAdapterConstants;
  includeProposalsExistingOnlyOffchain?: boolean;
}): UseProposalsReturn {
  /**
   * State
   */

  const [adapterAddress, setAdapterAddress] = useState<string>();

  const [snapshotDraftAndProposals, setSnapshotDraftAndProposals] =
    useState<SnapshotDraftAndProposalEntries>(INITIAL_ARRAY);

  const [snapshotDraftAndProposalsStatus, setSnapshotDraftAndProposalsStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  const [snapshotDraftAndProposalsError, setSnapshotDraftAndProposalsError] =
    useState<Error | undefined>();

  const [daoProposalIdsToUse, setDaoProposalIdsToUse] =
    useState<string[]>(INITIAL_ARRAY);

  const [proposals, setProposals] = useState<ProposalData[]>(INITIAL_ARRAY);

  // The overall status of the async data being fetched
  const [proposalsInclusiveStatus, setProposalsInclusiveStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  // Any error of the async data being fetched
  const [proposalsInclusiveError, setProposalsInclusiveError] =
    useState<Error>();

  /**
   * Selectors
   */

  const contracts = useSelector((s: StoreState) => s.contracts);

  /**
   * Memo
   */

  const snapshotDraftAndProposalsIds: string[] = useMemo(
    () => snapshotDraftAndProposals.map((e) => e[0]),
    [snapshotDraftAndProposals]
  );

  /**
   * Our hooks
   */

  /**
   * Fetch DAO proposals, if there are `snapshotDraftAndProposals`.
   *
   * Dependent upon `snapshotDraftAndProposals`.
   */
  const {daoProposals, daoProposalsError, daoProposalsStatus} = useDaoProposals(
    snapshotDraftAndProposalsIds
  );

  /**
   * Fetch on-chain voting adapter data for proposals of which voting adapters have been assigned (i.e. sponsored).
   *
   * Dependent upon `daoProposals`.
   */
  const {
    proposalsVotingAdapters,
    proposalsVotingAdaptersError,
    proposalsVotingAdaptersStatus,
  } = useProposalsVotingAdapter(daoProposalIdsToUse);

  /**
   * Fetch on-chain voting state for proposals of which voting adapters have been assigned (i.e. sponsored).
   *
   * Dependent upon `useProposalsVotingAdapter`.
   */
  const {
    proposalsVotingState,
    proposalsVotingStateError,
    proposalsVotingStateStatus,
  } = useProposalsVotingState(proposalsVotingAdapters);

  /**
   * Fetch on-chain votes data for proposals of which voting adapters have been assigned (i.e. sponsored)
   *
   * Dependent upon `useProposalsVotingAdapter`.
   */
  const {proposalsVotes, proposalsVotesError, proposalsVotesStatus} =
    useProposalsVotes(proposalsVotingAdapters);

  /**
   * Their hooks
   */

  const queryClient = useQueryClient();

  /**
   * Cached callbacks
   */

  const handleGetAllSnapshotDraftsAndProposalsCached = useCallback(
    handleGetAllSnapshotDraftsAndProposals,
    [queryClient]
  );

  /**
   * Effects
   */

  // Get and set the adapter address
  useEffect(() => {
    // @note We don't use the helper function as we don't want it to throw here.
    const address = Object.entries(contracts).find(
      ([_, c]) => c?.adapterOrExtensionName === adapterName
    )?.[1]?.contractAddress;

    setAdapterAddress(address);
  }, [adapterAddress, adapterName, contracts]);

  // Get and set all Snapshot drafts and proposal entries
  useEffect(() => {
    if (!adapterAddress) return;

    handleGetAllSnapshotDraftsAndProposalsCached(adapterAddress);
  }, [adapterAddress, handleGetAllSnapshotDraftsAndProposalsCached]);

  // Set the DAO proposal IDs we want to work with
  useEffect(() => {
    if (!daoProposals.length) return;

    if (includeProposalsExistingOnlyOffchain) {
      // Do not filter-out proposals which exist only off-chain
      return setDaoProposalIdsToUse(daoProposals.map(([id]) => id));
    }

    // Filter-out proposals which do not exist onchain
    return setDaoProposalIdsToUse(
      daoProposals.filter(([_, p]) => p.flags !== '0').map(([id]) => id)
    );
  }, [daoProposals, includeProposalsExistingOnlyOffchain]);

  // Set `proposals` with any returned data, once overall `AsyncStatus` equals `FULFILLED`
  useEffect(() => {
    if (proposalsInclusiveStatus !== AsyncStatus.FULFILLED) {
      return;
    }

    const proposalsToSet = daoProposalIdsToUse
      .map((id): ProposalData => {
        const [, daoProposal] =
          daoProposals.find(
            ([daoProposalId]) =>
              normalizeString(daoProposalId) === normalizeString(id)
          ) || [];

        const [snapshotDataId, snapshotData] =
          snapshotDraftAndProposals.find(
            ([snapshotId]) =>
              normalizeString(snapshotId) === normalizeString(id)
          ) || [];

        const isSnapshotDraft: boolean =
          snapshotData?.msg.type === SnapshotType.draft;

        const snapshotDraft: SnapshotDraft | undefined =
          snapshotDataId && isSnapshotDraft
            ? {
                ...(snapshotData as SnapshotDraft),
                // @todo Rename to `idForDAO` as it is more accurate, as the ID may not yet exist in the DAO.
                idInDAO: id,
                idInSnapshot: snapshotDataId,
              }
            : undefined;

        const snapshotProposal: SnapshotProposal | undefined =
          snapshotDataId && !isSnapshotDraft
            ? {
                ...(snapshotData as SnapshotProposal),
                // @todo Rename to `idForDAO` as it is more accurate, as the ID may not yet exist in the DAO.
                idInDAO: id,
                idInSnapshot: snapshotDataId,
              }
            : undefined;

        const daoProposalVotingAdapter = proposalsVotingAdapters.find(
          ([proposalIdVotingAdapter]) =>
            normalizeString(proposalIdVotingAdapter) === normalizeString(id)
        )?.[1];

        const daoProposalVotingState = proposalsVotingState.find(
          ([proposalIdVotingState]) =>
            normalizeString(proposalIdVotingState) === normalizeString(id)
        )?.[1];

        const daoProposalVote = proposalsVotes.find(
          ([proposalIdVotes]) =>
            normalizeString(id) === normalizeString(proposalIdVotes)
        )?.[1];

        return {
          daoProposal,
          daoProposalVote,
          daoProposalVotingAdapter,
          daoProposalVotingState,
          /**
           * @todo Work to remove `idInDAO` on the root. Don't think we use this?
           */
          idInDAO: id,
          snapshotDraft,
          snapshotProposal,
          snapshotType: isSnapshotDraft
            ? SnapshotType.draft
            : SnapshotType.proposal,

          // @todo Make type optional
          getCommonSnapshotProposalData: () => undefined,
          // @todo Make type optional
          refetchProposalOrDraft: () => {},
        };
      })
      .filter((p) => p.snapshotDraft || p.snapshotProposal);

    // Set proposals
    setProposals(proposalsToSet);
  }, [
    daoProposalIdsToUse,
    daoProposals,
    proposalsInclusiveStatus,
    proposalsVotes,
    proposalsVotingAdapters,
    proposalsVotingState,
    snapshotDraftAndProposals,
  ]);

  // Set overall async status
  useEffect(() => {
    const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;

    const statuses = [
      daoProposalsStatus,
      proposalsVotingAdaptersStatus,
      proposalsVotingStateStatus,
      proposalsVotesStatus,
      snapshotDraftAndProposalsStatus,
    ];

    /**
     * Standby
     *
     * The other statuses rely on Snapshot drafts and proposals being fetched,
     * so it's only in `STANDBY` at the point the Snapshot data has
     * not yet been fetched.
     */
    if (snapshotDraftAndProposalsStatus === STANDBY) {
      setProposalsInclusiveStatus(STANDBY);

      return;
    }

    // Pending
    if (statuses.some((s) => s === PENDING)) {
      setProposalsInclusiveStatus(PENDING);

      return;
    }

    // Fulfilled
    if (statuses.every((s) => s === FULFILLED)) {
      setProposalsInclusiveStatus(FULFILLED);

      return;
    }

    /**
     * Fulfilled: no `snapshotDraftAndProposals` were found.
     *
     * Since the other data-fetching hooks rely on `snapshotDraftAndProposals`
     * their statuses will be in `STANDBY` if `snapshotDraftAndProposals` is empty.
     */
    if (
      snapshotDraftAndProposalsStatus === FULFILLED &&
      !snapshotDraftAndProposals.length
    ) {
      setProposalsInclusiveStatus(FULFILLED);

      return;
    }

    /**
     * Fulfilled: No data was returned after running `useProposalsVotingAdapter`.
     *
     * The hooks `useProposalsVotingState`, `useProposalsVotes` are dependent upon `proposalsVotingAdapters`,
     * so if there is no data, at this point, it's safe to return `FULFILLED`.
     */
    if (
      proposalsVotingAdaptersStatus === FULFILLED &&
      !proposalsVotingAdapters.length
    ) {
      setProposalsInclusiveStatus(FULFILLED);

      return;
    }

    // Rejected
    if (statuses.some((s) => s === REJECTED)) {
      setProposalsInclusiveStatus(REJECTED);

      return;
    }
  }, [
    daoProposalIdsToUse.length,
    daoProposalsStatus,
    proposalsVotesStatus,
    proposalsVotingAdapters,
    proposalsVotingAdaptersStatus,
    proposalsVotingStateStatus,
    snapshotDraftAndProposals.length,
    snapshotDraftAndProposalsStatus,
  ]);

  // Set any error from async calls
  useEffect(() => {
    setProposalsInclusiveError(
      [
        daoProposalsError,
        proposalsVotesError,
        proposalsVotingAdaptersError,
        proposalsVotingStateError,
        snapshotDraftAndProposalsError,
      ].find((e) => e)
    );
  }, [
    daoProposalsError,
    proposalsVotesError,
    proposalsVotingAdaptersError,
    proposalsVotingStateError,
    snapshotDraftAndProposalsError,
  ]);

  /**
   * Functions
   */

  async function handleGetAllSnapshotDraftsAndProposals(
    adapterAddress: string
  ) {
    try {
      setSnapshotDraftAndProposalsStatus(AsyncStatus.PENDING);
      // Reset error
      setSnapshotDraftAndProposalsError(undefined);

      const snapshotDraftEntries = await queryClient.fetchQuery(
        ['snapshotDraftsByAdapterAddress', adapterAddress],
        async () => await getSnapshotDraftsByAdapterAddress(adapterAddress),
        {
          staleTime: 60000,
        }
      );

      const snapshotProposalEntries = await queryClient.fetchQuery(
        ['snapshotProposalsByAdapterAddress', adapterAddress],
        async () => await getSnapshotProposalsByAdapterAddress(adapterAddress),
        {
          staleTime: 60000,
        }
      );

      const mergedEntries = [
        ...snapshotDraftEntries,
        ...snapshotProposalEntries,
      ];

      if (!mergedEntries.length) {
        setSnapshotDraftAndProposalsStatus(AsyncStatus.FULFILLED);

        return;
      }

      setSnapshotDraftAndProposals(mergedEntries);
      setSnapshotDraftAndProposalsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setSnapshotDraftAndProposalsStatus(AsyncStatus.REJECTED);
      setSnapshotDraftAndProposals(INITIAL_ARRAY);
      setSnapshotDraftAndProposalsError(error);
    }
  }

  return {
    proposals,
    proposalsError: proposalsInclusiveError,
    proposalsStatus: proposalsInclusiveStatus,
  };
}
