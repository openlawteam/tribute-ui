import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';
import {useQuery} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {ProposalVotingAdapterTuple} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingState} from '../voting/types';

type ProposalsVotingStateTuples = [
  proposalId: string,
  votingState: VotingState
][];

type UseProposalsVotingStateReturn = {
  proposalsVotingState: ProposalsVotingStateTuples;
  proposalsVotingStateError: Error | undefined;
  proposalsVotingStateStatus: AsyncStatus;
};

export function useProposalsVotingState(
  /**
   * A tuple of proposal id's and voting adapter data.
   * This data is returned by `useProposalsVotingAdapter`.
   */
  proposalVotingAdapters: ProposalVotingAdapterTuple[]
): UseProposalsVotingStateReturn {
  /**
   * Selectors
   */

  const registryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * State
   */

  const [proposalsVotingState, setProposaslsVotingState] =
    useState<ProposalsVotingStateTuples>([]);

  const [proposalsVotingStateError, setProposalsVotingStateError] =
    useState<Error>();

  const [proposalsVotingStateStatus, setProposalsVotingStateStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  const [votingResultABIError, setVotingResultABIError] = useState<Error>();

  const [proposalsVotingStateCalls, setProposalsVotingStateCalls] =
    useState<MulticallTuple[]>();

  const [safeProposalVotingAdapters, setSafeProposalVotingAdapters] =
    useState<ProposalVotingAdapterTuple[]>();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * React Query
   */

  const {
    data: proposalsVotingStateResult,
    error: proposalsVotingStateResultError,
  } = useQuery(
    ['proposalsVotingStateResult', proposalsVotingStateCalls],
    async () => {
      if (!proposalsVotingStateCalls?.length || !web3Instance) {
        return;
      }

      return await multicall({
        calls: proposalsVotingStateCalls,
        web3Instance,
      });
    },
    {enabled: !!proposalsVotingStateCalls?.length && !!web3Instance}
  );

  /**
   * Cached callbacks
   */

  const getProposalsVotingStateOnchainCached = useCallback(
    getProposalsVotingStateOnchain,
    [
      proposalVotingAdapters.length,
      proposalsVotingStateCalls,
      proposalsVotingStateResult,
      proposalsVotingStateResultError,
      registryAddress,
      safeProposalVotingAdapters,
      votingResultABIError,
      web3Instance,
    ]
  );

  /**
   * Effects
   */

  useEffect(() => {
    getProposalsVotingStateOnchainCached();
  }, [getProposalsVotingStateOnchainCached]);

  useEffect(() => {
    if (!proposalVotingAdapters.length || !web3Instance) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalVotingAdaptersToSet = proposalVotingAdapters.filter(
      ([id]) => web3Instance.utils.isHexStrict(id)
    );

    setSafeProposalVotingAdapters(safeProposalVotingAdaptersToSet);
  }, [proposalVotingAdapters, web3Instance]);

  useEffect(() => {
    async function setProposalsVotingStateCallsPrepData() {
      if (!registryAddress || !safeProposalVotingAdapters?.length) return;

      const lazyIVotingABI = (
        await import('../../../abis/tribute-contracts/IVoting.json')
      ).default as AbiItem[];

      const votingResultABI = lazyIVotingABI.find(
        (ai) => ai.name === 'voteResult'
      );

      if (!votingResultABI) {
        setVotingResultABIError(
          new Error(
            'No "voteResult" ABI function was found on the "IVoting" contract.'
          )
        );

        return;
      }

      const proposalsVotingStateCallsToSet: MulticallTuple[] =
        safeProposalVotingAdapters.map(
          ([proposalId, {votingAdapterAddress}]) => [
            votingAdapterAddress,
            votingResultABI,
            [registryAddress, proposalId],
          ]
        );
      setProposalsVotingStateCalls(proposalsVotingStateCallsToSet);
    }

    setProposalsVotingStateCallsPrepData();
  }, [registryAddress, safeProposalVotingAdapters]);

  /**
   * Functions
   */

  async function getProposalsVotingStateOnchain() {
    if (
      !registryAddress ||
      !proposalVotingAdapters.length ||
      !safeProposalVotingAdapters ||
      !web3Instance
    ) {
      return;
    }

    if (!safeProposalVotingAdapters.length) {
      setProposalsVotingStateStatus(AsyncStatus.FULFILLED);

      return;
    }

    try {
      if (votingResultABIError) {
        throw votingResultABIError;
      }

      if (!proposalsVotingStateCalls) return;

      setProposalsVotingStateStatus(AsyncStatus.PENDING);

      if (proposalsVotingStateResultError) {
        throw proposalsVotingStateResultError;
      }

      if (proposalsVotingStateResult) {
        setProposalsVotingStateStatus(AsyncStatus.FULFILLED);
        setProposaslsVotingState(
          safeProposalVotingAdapters.map(([proposalId], i) => [
            proposalId,
            proposalsVotingStateResult[i],
          ])
        );
      }
    } catch (error) {
      setProposalsVotingStateStatus(AsyncStatus.REJECTED);
      setProposaslsVotingState([]);
      setProposalsVotingStateError(error);
    }
  }

  return {
    proposalsVotingState,
    proposalsVotingStateError,
    proposalsVotingStateStatus,
  };
}
