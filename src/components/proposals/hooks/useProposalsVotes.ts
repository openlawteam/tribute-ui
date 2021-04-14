import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {OffchainVotingAdapterVotes, VotingAdapterVotes} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingAdapterName} from '../../adapters-extensions/enums';

type ProposalsVotesTuples = [
  proposalId: string,
  /**
   * For each proposal, each result is stored under its adapter name.
   */
  adapterData: {
    [VotingAdapterName.OffchainVotingContract]?: OffchainVotingAdapterVotes;
    [VotingAdapterName.VotingContract]?: VotingAdapterVotes;
  }
][];

type UseProposalsVotesReturn = {
  proposalsVotes: ProposalsVotesTuples;
  proposalsVotesError: Error | undefined;
  proposalsVotesStatus: AsyncStatus;
};

export function useProposalsVotes(
  proposalIds: string[]
): UseProposalsVotesReturn {
  /**
   * Selectors
   */

  const registryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );
  const registryABI = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.abi
  );

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [proposalsVotes, setProposalsVotes] = useState<ProposalsVotesTuples>(
    []
  );
  const [proposalsVotesError, setProposalsVotesError] = useState<Error>();
  const [proposalsVotesStatus, setProposalsVotesStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Cached callbacks
   */

  const getProposalsVotesOnchainCached = useCallback(getProposalsVotesOnchain, [
    proposalIds,
    registryABI,
    registryAddress,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getProposalsVotesOnchainCached();
  }, [getProposalsVotesOnchainCached]);

  /**
   * Functions
   */

  async function getProposalsVotesOnchain() {
    if (!registryAddress || !registryABI || !proposalIds.length) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalIds = proposalIds.filter(web3Instance.utils.isHexStrict);

    if (!safeProposalIds.length) {
      setProposalsVotesStatus(AsyncStatus.FULFILLED);

      return;
    }

    try {
      const votingAdapterABI = registryABI.find(
        (ai) => ai.name === 'votingAdapter'
      );

      if (!votingAdapterABI) {
        throw new Error(
          'No "votingAdapter" ABI function was found in the DAO registry ABI.'
        );
      }

      // `DaoRegistry.votingAdapter` calls
      const votingAdapterCalls: MulticallTuple[] = safeProposalIds.map((id) => [
        registryAddress,
        votingAdapterABI,
        [id],
      ]);

      setProposalsVotesStatus(AsyncStatus.PENDING);

      const votingAdapterAddressResults: string[] = await multicall({
        calls: votingAdapterCalls,
        web3Instance,
      });

      const {default: lazyIVotingABI} = await import(
        '../../../truffle-contracts/IVoting.json'
      );

      const getAdapterNameABI = (lazyIVotingABI as typeof registryABI).find(
        (ai) => ai.name === 'getAdapterName'
      );

      if (!getAdapterNameABI) {
        throw new Error(
          'No "getAdapterName" ABI function was found in the IVoting ABI.'
        );
      }

      /**
       * Filter out `safeProposalIds` which are not sponsored (i.e. voting adapter address === `BURN_ADDRESS`).
       * Filter out `votingAdapterAddressResults` which equal the `BURN_ADDRESS`.
       *
       * This ensures these two arrays maintain the same length as they rely on indexes for the
       * proposals to match up to the array of `multicall` results.
       */

      const filteredProposalIds = safeProposalIds.filter(
        (_id, i) => votingAdapterAddressResults[i] !== BURN_ADDRESS
      );

      const filteredVotingAdapterAddressResults = votingAdapterAddressResults.filter(
        (a) => a !== BURN_ADDRESS
      );

      /**
       * Exit early if there's no voting adapter addresses.
       * It means no proposals were found to be sponsored
       */
      if (!filteredVotingAdapterAddressResults.length) {
        setProposalsVotesStatus(AsyncStatus.FULFILLED);
        setProposalsVotes([]);

        return;
      }

      const votingAdapterNameCalls: MulticallTuple[] = filteredVotingAdapterAddressResults.map(
        (votingAdapterAddress) => [votingAdapterAddress, getAdapterNameABI, []]
      );

      const adapterNameResults: VotingAdapterName[] = await multicall({
        calls: votingAdapterNameCalls,
        web3Instance,
      });

      let adapterNameMap: Record<string, VotingAdapterName>;

      // Build votes results
      const votesDataCalls: MulticallTuple[] = await Promise.all(
        filteredProposalIds.map(
          async (id, i): Promise<MulticallTuple> => {
            // Set adapter name for setting the state later
            adapterNameMap = {
              ...adapterNameMap,
              [id]: adapterNameResults[i],
            };

            return [
              filteredVotingAdapterAddressResults[i],
              await getVotesDataABI(adapterNameResults[i]),
              /**
               * We build the call arguments the same way for the different voting adapters
               * (i.e. [dao, proposalId]). If we need to change this we can move it to another function.
               */
              [registryAddress, id],
            ];
          }
        )
      );

      const votesDataResults = await multicall({
        calls: votesDataCalls,
        web3Instance,
      });

      setProposalsVotesStatus(AsyncStatus.FULFILLED);
      setProposalsVotes(
        safeProposalIds.map((id, i) => [
          id,
          {
            [adapterNameMap[id]]: votesDataResults[i],
          },
        ])
      );
    } catch (error) {
      setProposalsVotesStatus(AsyncStatus.REJECTED);
      setProposalsVotes([]);
      setProposalsVotesError(error);
    }
  }

  /**
   * getVotesDataABI
   *
   * Gets the ABI for the public mapping getter of voting data.
   *
   * @param {VotingAdapterName} votingAdapterName
   * @returns {Promise<AbiItem>}
   */
  async function getVotesDataABI(
    votingAdapterName: VotingAdapterName
  ): Promise<AbiItem> {
    try {
      switch (votingAdapterName) {
        case VotingAdapterName.OffchainVotingContract:
          const {default: lazyOffchainVotingABI} = await import(
            '../../../truffle-contracts/OffchainVotingContract.json'
          );

          const offchainVotesDataABI = (lazyOffchainVotingABI as AbiItem[]).find(
            (ai) => ai.name === 'votes'
          );

          if (!offchainVotesDataABI) {
            throw new Error(
              `No "votes" function ABI was found for "${votingAdapterName}".`
            );
          }

          return offchainVotesDataABI;

        case VotingAdapterName.VotingContract:
          const {default: lazyVotingABI} = await import(
            '../../../truffle-contracts/VotingContract.json'
          );

          const votingVotesDataABI = (lazyVotingABI as AbiItem[]).find(
            (ai) => ai.name === 'votes'
          );

          if (!votingVotesDataABI) {
            throw new Error(
              `No "votes" function ABI was found for "${votingAdapterName}".`
            );
          }

          return votingVotesDataABI;

        default:
          throw new Error(
            `No voting adapter name was found for "${votingAdapterName}".`
          );
      }
    } catch (error) {
      throw error;
    }
  }

  return {
    proposalsVotes,
    proposalsVotesError,
    proposalsVotesStatus,
  };
}
