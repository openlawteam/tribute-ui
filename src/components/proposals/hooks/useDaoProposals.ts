import {AbiItem} from 'web3-utils/types';
import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {Proposal} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';

type DaoProposalEntries = [proposalId: string, proposal: Proposal[]][];

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

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

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

    handleGetDaoProposals({
      proposalIds,
      proposalsAbi,
      registryAddress,
      web3Instance,
    });
  }, [proposalIds, proposalsAbi, registryAddress, web3Instance]);

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
      if (!proposalIds.length) return;

      setDaoProposalsStatus(AsyncStatus.PENDING);
      // Reset error
      setDaoProposalsError(undefined);

      const calls: MulticallTuple[] = proposalIds.map((id) => [
        registryAddress,
        proposalsAbi,
        [id],
      ]);

      const proposals = await multicall({
        calls,
        web3Instance,
      });

      setDaoProposals(proposalIds.map((id, i) => [id, proposals[i]]));
      setDaoProposalsStatus(AsyncStatus.FULFILLED);
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
