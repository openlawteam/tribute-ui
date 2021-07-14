import {AbiItem} from 'web3-utils/types';
import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {Proposal} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';

type UseDaoProposalsReturn = {
  daoProposals: Proposal[];
  daoProposalsStatus: AsyncStatus;
  daoProposalsError: Error | undefined;
};

const INITIAL_DAO_PROPOSALS: Proposal[] = [];

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

  const [daoProposals, setDaoProposals] = useState<Proposal[]>(
    INITIAL_DAO_PROPOSALS
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

      setDaoProposals(
        await multicall({
          calls,
          web3Instance,
        })
      );

      setDaoProposalsStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setDaoProposals(INITIAL_DAO_PROPOSALS);
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
