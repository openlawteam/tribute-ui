import {useEffect, useState, useCallback} from 'react';
import {useSelector} from 'react-redux';
import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';
import {useQuery} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {Proposal} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';

type DaoProposalEntries = [proposalId: string, proposal: Proposal][];

type UseDaoProposalsReturn = {
  daoProposals: DaoProposalEntries;
  daoProposalsStatus: AsyncStatus;
  daoProposalsError: Error | undefined;
};

const INITIAL_DAO_PROPOSAL_ENTRIES: DaoProposalEntries = [];

/**
 * useDaoProposals
 *
 * Gets `proposals` by their id from the DAO via `multicall`.
 *
 * @param proposalIds
 * @returns `UseDaoProposalsReturn`
 */
export function useDaoProposals(proposalIds: string[]): UseDaoProposalsReturn {
  /**
   * Selectors
   */

  const proposalsAbi = useSelector((s: StoreState) =>
    s.contracts.DaoRegistryContract?.abi.find((a) => a.name === 'proposals')
  );

  const registryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * State
   */

  const [daoProposals, setDaoProposals] = useState<DaoProposalEntries>(
    INITIAL_DAO_PROPOSAL_ENTRIES
  );

  const [daoProposalsStatus, setDaoProposalsStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  const [daoProposalsError, setDaoProposalsError] = useState<Error>();

  const [safeProposalIds, setSafeProposalIds] = useState<string[]>();

  const [daoProposalsCalls, setDaoProposalsCalls] =
    useState<MulticallTuple[]>();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Their hooks
   */

  const {data: daoProposalsData, error: daoProposalsQueryError} = useQuery(
    ['daoProposals', daoProposalsCalls],
    async () =>
      await multicall({
        calls: daoProposalsCalls as MulticallTuple[],
        web3Instance: web3Instance as Web3,
      }),
    {enabled: !!daoProposalsCalls && !!web3Instance}
  );

  /**
   * Cached callbacks
   */

  const handleGetDaoProposalsCached = useCallback(handleGetDaoProposals, [
    daoProposalsCalls,
    daoProposalsData,
    daoProposalsQueryError,
    safeProposalIds,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (
      !proposalIds.length ||
      !proposalsAbi ||
      !registryAddress ||
      !web3Instance
    ) {
      return;
    }

    handleGetDaoProposalsCached({
      proposalIds,
      proposalsAbi,
      registryAddress,
      web3Instance,
    });
  }, [
    handleGetDaoProposalsCached,
    proposalIds,
    proposalsAbi,
    registryAddress,
    web3Instance,
  ]);

  useEffect(() => {
    if (!proposalIds.length || !web3Instance) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalIdsToSet = proposalIds.filter(
      web3Instance.utils.isHexStrict
    );

    setSafeProposalIds(safeProposalIdsToSet);
  }, [proposalIds, web3Instance]);

  useEffect(() => {
    if (!proposalsAbi || !registryAddress || !safeProposalIds?.length) return;

    const daoProposalsCallsToSet: MulticallTuple[] = safeProposalIds.map(
      (id) => [registryAddress, proposalsAbi, [id]]
    );

    setDaoProposalsCalls(daoProposalsCallsToSet);
  }, [proposalsAbi, registryAddress, safeProposalIds]);

  /**
   * Functions
   */

  async function handleGetDaoProposals({
    proposalIds,
    proposalsAbi,
    registryAddress,
    web3Instance,
  }: {
    proposalIds: string[];
    proposalsAbi: AbiItem;
    registryAddress: string;
    web3Instance: Web3;
  }) {
    try {
      if (!proposalIds.length || !safeProposalIds) return;

      if (!safeProposalIds.length) {
        setDaoProposalsStatus(AsyncStatus.FULFILLED);
        setDaoProposals([]);

        return;
      }

      setDaoProposalsStatus(AsyncStatus.PENDING);
      // Reset error
      setDaoProposalsError(undefined);

      if (!daoProposalsCalls) return;

      if (daoProposalsQueryError) {
        throw daoProposalsQueryError;
      }

      if (daoProposalsData) {
        setDaoProposals(
          safeProposalIds.map((id, i) => [id, daoProposalsData[i]])
        );
        setDaoProposalsStatus(AsyncStatus.FULFILLED);
      }
    } catch (error) {
      setDaoProposals(INITIAL_DAO_PROPOSAL_ENTRIES);
      setDaoProposalsError(error);
      setDaoProposalsStatus(AsyncStatus.REJECTED);
    }
  }

  return {
    daoProposals,
    daoProposalsStatus,
    daoProposalsError,
  };
}
