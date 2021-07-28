import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';
import {useQueryClient} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {ProposalVotesData, ProposalVotingAdapterTuple} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingAdapterName} from '../../adapters-extensions/enums';

type ProposalsVotesTuple = [
  proposalId: string,
  /**
   * For each proposal, each result is stored under its adapter name.
   */
  adapterData: ProposalVotesData
];

type UseProposalsVotesReturn = {
  proposalsVotes: ProposalsVotesTuple[];
  proposalsVotesError: Error | undefined;
  proposalsVotesStatus: AsyncStatus;
};

export function useProposalsVotes(
  /**
   * A tuple of proposal id's and voting adapter data.
   * This data is returned by `useProposalsVotingAdapter`.
   */
  proposalVotingAdapters: ProposalVotingAdapterTuple[]
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
   * Their hooks
   */

  const queryClient = useQueryClient();

  /**
   * State
   */

  const [proposalsVotes, setProposalsVotes] = useState<ProposalsVotesTuple[]>(
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
    proposalVotingAdapters,
    queryClient,
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
    if (
      !proposalVotingAdapters.length ||
      !registryABI ||
      !registryAddress ||
      !web3Instance
    ) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalVotingAdapters = proposalVotingAdapters.filter(([id]) =>
      web3Instance.utils.isHexStrict(id)
    );

    if (!safeProposalVotingAdapters.length) {
      setProposalsVotesStatus(AsyncStatus.FULFILLED);
      setProposalsVotes([]);

      return;
    }

    try {
      setProposalsVotesStatus(AsyncStatus.PENDING);

      // Build votes results
      const votesDataCalls: MulticallTuple[] = await queryClient.fetchQuery(
        ['votesDataCalls', safeProposalVotingAdapters],
        async () =>
          await Promise.all(
            safeProposalVotingAdapters.map(
              async ([
                proposalId,
                {votingAdapterAddress, getVotingAdapterABI, votingAdapterName},
              ]): Promise<MulticallTuple> => [
                votingAdapterAddress,
                await getVotesDataABI(votingAdapterName, getVotingAdapterABI()),
                /**
                 * We build the call arguments the same way for the different voting adapters
                 * (i.e. [dao, proposalId]). If we need to change this we can move it to another function.
                 */
                [registryAddress, proposalId],
              ]
            )
          ),
        {
          staleTime: 60000,
        }
      );

      const votesDataResults = await queryClient.fetchQuery(
        ['votesDataResults', votesDataCalls],
        async () => await multicall({calls: votesDataCalls, web3Instance}),
        {
          staleTime: 60000,
        }
      );

      setProposalsVotesStatus(AsyncStatus.FULFILLED);
      setProposalsVotes(
        safeProposalVotingAdapters.map(
          ([proposalId, {votingAdapterName}], i) => [
            proposalId,
            {
              [votingAdapterName]: votesDataResults[i],
            },
          ]
        )
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
    votingAdapterName: VotingAdapterName,
    votingAdapterABI: AbiItem[]
  ): Promise<AbiItem> {
    try {
      switch (votingAdapterName) {
        case VotingAdapterName.OffchainVotingContract:
          const offchainVotesDataABI = votingAdapterABI.find(
            (ai) => ai.name === 'votes'
          );

          if (!offchainVotesDataABI) {
            throw new Error(
              `No "votes" function ABI was found for "${votingAdapterName}".`
            );
          }

          return offchainVotesDataABI;

        case VotingAdapterName.VotingContract:
          const votingVotesDataABI = votingAdapterABI.find(
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
