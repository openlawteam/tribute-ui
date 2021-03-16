import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';
import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../../util/types';
import {DaoAdapterConstants} from '../../adapters-extensions/enums';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {Proposal, ProposalData} from '../types';
import {SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {StoreState} from '../../../store/types';
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
 * @returns `UseProposalsReturn` An object with the proposals, and the current async status.
 */
export function useProposals({
  adapterName,
}: {
  adapterName: DaoAdapterConstants;
}): UseProposalsReturn {
  /**
   * State
   */

  const [adapterAddress, setAdapterAddress] = useState<string>();
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [proposalsError, setProposalsError] = useState<Error>();
  const [proposalsStatus, setProposalsStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

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
   * Their hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const getProposalsOnchainCached = useCallback(getProposalsOnchain, [
    web3Instance,
  ]);
  const handleGetProposalsCached = useCallback(handleGetProposals, [
    adapterAddress,
    getProposalsOnchainCached,
    registryAbi,
    registryAddress,
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

  useEffect(() => {
    handleGetProposalsCached();
  }, [handleGetProposalsCached]);

  /**
   * Functions
   */

  // Gets Drafts (unsponsored Proposals) from Snapshot Hub
  async function getSnapshotDraftsByAdapterAddress(adapterAddress: string) {
    try {
      const baseURL = `${SNAPSHOT_HUB_API_URL}/api/${SPACE}`;

      const drafts = await fetch(`${baseURL}/drafts/${adapterAddress}`);

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

      const proposalsJSON: SnapshotProposalResponse = await proposals.json();

      /**
       * Re-map entries setting the correct id used for the `proposalId` in the DAO.
       * If it has a draft hash, then this is what was submitted to the DAO, most likely (e.g. submit proposal)
       */
      const proposalEntries = Object.entries(proposalsJSON).map(([id, p]): [
        string,
        SnapshotProposalResponseData
      ] => [p.data.erc712DraftHash || id, p]);

      return proposalEntries;
    } catch (error) {
      throw error;
    }
  }

  /**
   * getProposalsOnchain
   *
   * Gets on-chain proposals based on Snapshot Draft/Proposal ids,
   * while filtering out proposals which were not found.
   *
   * @note Should be called as a fallback to the subgraph failing.
   *
   * @returns `Promise<[string, Proposal][]` An array of tuples of [id, Proposal]
   */
  async function getProposalsOnchain({
    proposalIds,
    registryAbi,
    registryAddress,
  }: {
    proposalIds: string[];
    registryAbi: AbiItem[];
    registryAddress: string;
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

      // Filter-out proposals which do not exist
      return entries.filter(([_, p]) => p.flags !== '0');
    } catch (error) {
      throw error;
    }
  }

  async function handleGetProposals() {
    if (!adapterAddress) return;
    if (!registryAbi) return;
    if (!registryAddress) return;

    try {
      setProposalsStatus(AsyncStatus.PENDING);

      const snapshotDraftEntries = await getSnapshotDraftsByAdapterAddress(
        adapterAddress
      );
      const snapshotProposalEntries = await getSnapshotProposalsByAdapterAddress(
        adapterAddress
      );

      const proposalIds = [
        ...snapshotDraftEntries,
        ...snapshotProposalEntries,
      ].map((e) => e[0]);

      if (!proposalIds.length) {
        setProposalsStatus(AsyncStatus.FULFILLED);

        return;
      }

      // @todo `daoProposals`: swich/case depending on subgraph up/down
      // ...

      let daoProposals = await getProposalsOnchainCached({
        proposalIds,
        registryAbi,
        registryAddress,
      });

      const proposalDataMap = daoProposals
        .map(
          ([idInDAO, p]): ProposalData => {
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
              daoProposal: p,
              snapshotDraft,
              getCommonSnapshotProposalData: () => undefined,
              refetchProposalOrDraft: () => {},
              snapshotProposal,
              snapshotType: snapshotProposal
                ? SnapshotType.proposal
                : SnapshotType.draft,
            };
          }
        )
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
    proposalsError,
    proposalsStatus,
  };
}
