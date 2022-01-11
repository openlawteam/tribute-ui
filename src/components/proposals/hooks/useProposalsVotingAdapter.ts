import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {getVotingAdapterABI} from '../helpers';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {ProposalVotingAdapterData} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingAdapterName} from '../../adapters-extensions/enums';

type ProposalVotingAdapterTuple = [
  proposalId: string,
  votingAdapterData: ProposalVotingAdapterData
];

type UseProposalsVotingAdapterReturn = {
  proposalsVotingAdapters: ProposalVotingAdapterTuple[];
  proposalsVotingAdaptersError: Error | undefined;
  proposalsVotingAdaptersStatus: AsyncStatus;
};

const INITIAL_VOTING_ADAPTERS: ProposalVotingAdapterTuple[] = [];

/**
 * Fetch voting adapter data for proposals by DAO proposal id.
 * Only returns data for proposals of which voting adapters have been assigned (i.e. sponsored).
 *
 * @param {string[]}
 * @returns {UseProposalsVotingAdapterReturn}
 */
export function useProposalsVotingAdapter(
  proposalIds: string[]
): UseProposalsVotingAdapterReturn {
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

  const [proposalsVotingAdapters, setProposalsVotingAdapters] = useState<
    ProposalVotingAdapterTuple[]
  >(INITIAL_VOTING_ADAPTERS);

  const [proposalsVotingAdaptersError, setProposalsVotingAdaptersError] =
    useState<Error | undefined>();

  const [proposalsVotingAdaptersStatus, setProposalsVotingAdaptersStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  /**
   * Cached callbacks
   */

  const getProposalsVotingAdaptersOnchainCached = useCallback(
    getProposalsVotingAdaptersOnchain,
    [proposalIds, registryABI, registryAddress, web3Instance]
  );

  /**
   * Effects
   */

  useEffect(() => {
    getProposalsVotingAdaptersOnchainCached();
  }, [getProposalsVotingAdaptersOnchainCached]);

  /**
   * Functions
   */

  async function getProposalsVotingAdaptersOnchain(): Promise<void> {
    if (
      !proposalIds.length ||
      !registryABI ||
      !registryAddress ||
      !web3Instance
    ) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalIds = proposalIds.filter(web3Instance.utils.isHexStrict);

    if (!safeProposalIds.length) {
      setProposalsVotingAdapters(INITIAL_VOTING_ADAPTERS);
      setProposalsVotingAdaptersStatus(AsyncStatus.FULFILLED);

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

      setProposalsVotingAdaptersStatus(AsyncStatus.PENDING);

      const votingAdapterAddressResults: string[] = await multicall({
        calls: votingAdapterCalls,
        web3Instance,
      });

      const {default: lazyIVotingABI} = await import(
        '../../../abis/tribute-contracts/IVoting.json'
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

      const filteredVotingAdapterAddressResults =
        votingAdapterAddressResults.filter((a) => a !== BURN_ADDRESS);

      /**
       * Exit early if there's no voting adapter addresses.
       * It means no proposals were found to be sponsored
       */
      if (!filteredVotingAdapterAddressResults.length) {
        setProposalsVotingAdapters(INITIAL_VOTING_ADAPTERS);
        setProposalsVotingAdaptersStatus(AsyncStatus.FULFILLED);

        return;
      }

      const votingAdapterNameCalls: MulticallTuple[] =
        filteredVotingAdapterAddressResults.map((votingAdapterAddress) => [
          votingAdapterAddress,
          getAdapterNameABI,
          [],
        ]);

      const adapterNameResults: VotingAdapterName[] = await multicall({
        calls: votingAdapterNameCalls,
        web3Instance,
      });

      const votingAdaptersToSet = await Promise.all(
        filteredProposalIds.map(
          async (id, i): Promise<ProposalVotingAdapterTuple> => {
            const votingAdapterABI = await getVotingAdapterABI(
              adapterNameResults[i]
            );
            const votingAdapterAddress = filteredVotingAdapterAddressResults[i];

            return [
              id,
              {
                votingAdapterName: adapterNameResults[i],
                votingAdapterAddress,
                getVotingAdapterABI: () => votingAdapterABI,
                getWeb3VotingAdapterContract: <T>() =>
                  new web3Instance.eth.Contract(
                    votingAdapterABI,
                    votingAdapterAddress
                  ) as any as T,
              },
            ];
          }
        )
      );

      setProposalsVotingAdapters(votingAdaptersToSet);
      setProposalsVotingAdaptersStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setProposalsVotingAdaptersStatus(AsyncStatus.REJECTED);
      setProposalsVotingAdapters([]);
      setProposalsVotingAdaptersError(error);
    }
  }

  return {
    proposalsVotingAdapters,
    proposalsVotingAdaptersError,
    proposalsVotingAdaptersStatus,
  };
}
