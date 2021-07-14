import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';
import Web3 from 'web3';
import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {DaoAdapterConstants} from '../../adapters-extensions/enums';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {normalizeString} from '../../../util/helpers';
import {Proposal, ProposalData} from '../types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {StoreState} from '../../../store/types';
import {useProposalsVotes} from './useProposalsVotes';
import {useProposalsVotingAdapter} from './useProposalsVotingAdapter';
import {useProposalsVotingState} from '.';
import {useWeb3Modal} from '../../web3/hooks';

type UseProposalsReturn = {
  proposals: ProposalData[];
  proposalsStatus: AsyncStatus;
  proposalsError: Error | undefined;
};

/**
 * useProposals
 *
 * @todo Get proposals from subgraph (e.g. where proposalId_in: [...]).
 * @todo switch/case for retrieval method based on subgraph up/down
 * @todo Clean up noop functions in setting ProposalData - need a cleaner way to fulfill type.
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
  const [daoProposalIds, setDAOProposalIds] = useState<string[]>([]);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [proposalsError, setProposalsError] = useState<Error>();
  const [proposalsStatus, setProposalsStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

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
  const registryAbi = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  );
  const registryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * Our hooks
   */

  /**
   * Fetch on-chain voting adapter data for proposals.
   * Only returns data for proposals of which voting adapters have been assigned (i.e. sponsored).
   */
  const {
    proposalsVotingAdapters,
    proposalsVotingAdaptersError,
    proposalsVotingAdaptersStatus,
  } = useProposalsVotingAdapter(daoProposalIds);

  // Fetch on-chain voting state for proposals of which voting adapters have been assigned (i.e. sponsored)
  const {
    proposalsVotingState,
    proposalsVotingStateError,
    proposalsVotingStateStatus,
  } = useProposalsVotingState(proposalsVotingAdapters);

  // Fetch on-chain votes data for proposals of which voting adapters have been assigned (i.e. sponsored)
  const {proposalsVotes, proposalsVotesError, proposalsVotesStatus} =
    useProposalsVotes(proposalsVotingAdapters);

  // @todo remove
  console.log({proposalsVotingAdapters, proposalsVotingState, proposalsVotes});

  /**
   * Their hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const getProposalsCached = useCallback(getProposals, [
    includeProposalsExistingOnlyOffchain,
  ]);
  const handleGetProposalsCached = useCallback(handleGetProposals, [
    adapterAddress,
    getProposalsCached,
    registryAbi,
    registryAddress,
    web3Instance,
  ]);

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

  // Get proposals
  useEffect(() => {
    handleGetProposalsCached();
  }, [handleGetProposalsCached]);

  // Set `daoProposalVotingAdapter` data on the proposal
  useEffect(() => {
    if (!proposalsVotingAdapters.length) return;

    setProposals((prevState) =>
      prevState.map(
        (p): ProposalData => ({
          ...p,
          daoProposalVotingAdapter: proposalsVotingAdapters.find(
            ([id]) => normalizeString(id) === normalizeString(p.idInDAO || '')
          )?.[1],
        })
      )
    );
  }, [proposalsVotingAdapters]);

  // Set `daoProposalVotingState` data on the proposal
  useEffect(() => {
    if (!proposalsVotingState.length) return;

    setProposals((prevState) =>
      prevState.map(
        (p): ProposalData => ({
          ...p,
          daoProposalVotingState: proposalsVotingState.find(
            ([id]) => normalizeString(id) === normalizeString(p.idInDAO || '')
          )?.[1],
        })
      )
    );
  }, [proposalsVotingState]);

  // Set `daoProposalVotes` data on the proposal
  useEffect(() => {
    if (!proposalsVotes.length) return;

    setProposals((prevState) =>
      prevState.map(
        (p): ProposalData => ({
          ...p,
          daoProposalVotes: proposalsVotes.find(
            ([id]) => normalizeString(id) === normalizeString(p.idInDAO || '')
          )?.[1],
        })
      )
    );
  }, [proposalsVotes]);

  // Set overall async status
  useEffect(() => {
    const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;
    const statuses = [
      proposalsStatus,
      proposalsVotingAdaptersStatus,
      proposalsVotingStateStatus,
      proposalsVotesStatus,
    ];

    /**
     * Standby
     *
     * The other statuses rely on `proposals` being fetched,
     * so it's only in `STANDBY` at the point the proposals have
     * not yet been fetched.
     */
    if (proposalsStatus === STANDBY) {
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

    // Fulfilled: checked for DAO proposals and none were returned
    if (proposalsStatus === FULFILLED && !daoProposalIds.length) {
      setProposalsInclusiveStatus(FULFILLED);

      return;
    }

    // Fulfilled: checked for DAO proposals' voting adapters and none were returned - not sponsored
    if (
      proposalsStatus === FULFILLED &&
      proposalsVotingAdaptersStatus === FULFILLED &&
      daoProposalIds.length &&
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
    daoProposalIds.length,
    proposalsStatus,
    proposalsVotesStatus,
    proposalsVotingAdapters.length,
    proposalsVotingAdaptersStatus,
    proposalsVotingStateStatus,
  ]);

  // Set any error from async calls
  useEffect(() => {
    const errors = [
      proposalsError,
      proposalsVotingAdaptersError,
      proposalsVotingStateError,
      proposalsVotesError,
    ];

    setProposalsInclusiveError(errors.find((e) => e));
  }, [
    proposalsError,
    proposalsVotesError,
    proposalsVotingAdaptersError,
    proposalsVotingStateError,
  ]);

  /**
   * Functions
   */

  // Gets Drafts (unsponsored Proposals) from Snapshot Hub
  async function getSnapshotDraftsByAdapterAddress(adapterAddress: string) {
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
  async function getSnapshotProposalsByAdapterAddress(adapterAddress: string) {
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
   * getProposals
   *
   * Gets proposals based on Snapshot Draft/Proposal ids, while filtering out
   * proposals which were not found onchain. Optional
   * `includeProposalsExistingOnlyOffchain` flag can be set to also include
   * draft proposals that exist only offchain.
   *
   * @note Should be called as a fallback to the subgraph failing.
   *
   * @returns `Promise<[string, Proposal][]` An array of tuples of [id, Proposal]
   */
  async function getProposals({
    proposalIds,
    registryAbi,
    registryAddress,
    web3Instance,
  }: {
    proposalIds: string[];
    registryAbi: AbiItem[];
    registryAddress: string;
    web3Instance: Web3;
  }): Promise<[id: string, proposal: Proposal][]> {
    try {
      const proposalsAbi = registryAbi.find(
        (a) => a.name === 'proposals'
      ) as AbiItem;

      const calls: MulticallTuple[] = proposalIds.map((id) => [
        registryAddress,
        proposalsAbi,
        [id],
      ]);

      const proposals = (await multicall({
        calls,
        web3Instance,
      })) as Proposal[];

      const entries = proposalIds.map((id, i): [string, Proposal] => [
        id,
        proposals[i],
      ]);

      if (includeProposalsExistingOnlyOffchain) {
        return entries;
      } else {
        // Filter-out proposals which do not exist onchain
        return entries.filter(([_, p]) => p.flags !== '0');
      }
    } catch (error) {
      throw error;
    }
  }

  async function handleGetProposals() {
    if (!adapterAddress || !registryAbi || !registryAddress || !web3Instance) {
      return;
    }

    try {
      setProposalsStatus(AsyncStatus.PENDING);

      const snapshotDraftEntries = await getSnapshotDraftsByAdapterAddress(
        adapterAddress
      );
      const snapshotProposalEntries =
        await getSnapshotProposalsByAdapterAddress(adapterAddress);

      const proposalIds = [
        ...snapshotDraftEntries,
        ...snapshotProposalEntries,
      ].map((e) => e[0]);

      if (!proposalIds.length) {
        setProposalsStatus(AsyncStatus.FULFILLED);

        return;
      }

      // @todo `daoProposals`: swich/case depending on subgraph up/down

      let daoProposals = await getProposalsCached({
        proposalIds,
        registryAbi,
        registryAddress,
        web3Instance,
      });

      // Set the proposal IDs based on the DAO proposals' return data
      setDAOProposalIds(daoProposals.map(([id]) => id));

      const proposalDataMap = daoProposals
        .map(([idInDAO, p]): ProposalData => {
          const snapshotDraftEntry = snapshotDraftEntries.find(
            ([id]) => id === idInDAO
          );
          const snapshotProposalEntry = snapshotProposalEntries.find(
            ([id]) => id === idInDAO
          );

          const snapshotDraft = snapshotDraftEntry
            ? {
                ...snapshotDraftEntry[1],
                idInDAO,
                idInSnapshot: snapshotDraftEntry[0],
              }
            : undefined;

          const snapshotProposal = snapshotProposalEntry
            ? {
                ...snapshotProposalEntry[1],
                idInDAO,
                idInSnapshot: snapshotProposalEntry[0],
              }
            : undefined;

          return {
            idInDAO,
            daoProposal: p,
            // To be set later in a `useEffect` above
            daoProposalVotes: undefined,
            // To be set later in a `useEffect` above
            daoProposalVotingAdapter: undefined,
            // To be set later in a `useEffect` above
            daoProposalVotingState: undefined,
            snapshotDraft,
            getCommonSnapshotProposalData: () => undefined,
            refetchProposalOrDraft: () => {},
            snapshotProposal,
            snapshotType: snapshotProposal
              ? SnapshotType.proposal
              : SnapshotType.draft,
          };
        })
        .filter((p) => p.snapshotDraft || p.snapshotProposal);

      setProposalsStatus(AsyncStatus.FULFILLED);
      setProposals(proposalDataMap);
    } catch (error) {
      setProposalsStatus(AsyncStatus.REJECTED);
      setProposals([]);
      setProposalsError(error);
    }
  }

  return {
    proposals,
    proposalsError: proposalsInclusiveError,
    proposalsStatus: proposalsInclusiveStatus,
  };
}
