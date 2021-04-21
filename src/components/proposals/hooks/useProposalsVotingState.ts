import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils/types';

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
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [
    proposalsVotingState,
    setProposaslsVotingState,
  ] = useState<ProposalsVotingStateTuples>([]);

  const [
    proposalsVotingStateError,
    setProposalsVotingStateError,
  ] = useState<Error>();

  const [
    proposalsVotingStateStatus,
    setProposalsVotingStateStatus,
  ] = useState<AsyncStatus>(AsyncStatus.STANDBY);

  /**
   * Cached callbacks
   */

  const getProposalsVotingStateOnchainCached = useCallback(
    getProposalsVotingStateOnchain,
    [proposalVotingAdapters, registryAddress, web3Instance]
  );

  /**
   * Effects
   */

  useEffect(() => {
    getProposalsVotingStateOnchainCached();
  }, [getProposalsVotingStateOnchainCached]);

  /**
   * Functions
   */

  async function getProposalsVotingStateOnchain() {
    if (!registryAddress || !proposalVotingAdapters.length) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalVotingAdapters = proposalVotingAdapters.filter(([id]) =>
      web3Instance.utils.isHexStrict(id)
    );

    if (!safeProposalVotingAdapters.length) {
      setProposalsVotingStateStatus(AsyncStatus.FULFILLED);

      return;
    }

    try {
      const lazyIVotingABI = (
        await import('../../../truffle-contracts/IVoting.json')
      ).default as AbiItem[];

      const votingResultAbi = lazyIVotingABI.find(
        (ai) => ai.name === 'voteResult'
      );

      if (!votingResultAbi) {
        throw new Error(
          'No "voteResult" ABI function was found on the "IVoting" contract.'
        );
      }

      const calls: MulticallTuple[] = safeProposalVotingAdapters.map(
        ([proposalId, {votingAdapterAddress}]) => [
          votingAdapterAddress,
          votingResultAbi,
          [registryAddress, proposalId],
        ]
      );

      setProposalsVotingStateStatus(AsyncStatus.PENDING);

      const proposalsVotingStateResult = await multicall({
        calls,
        web3Instance,
      });

      setProposalsVotingStateStatus(AsyncStatus.FULFILLED);
      setProposaslsVotingState(
        safeProposalVotingAdapters.map(([proposalId], i) => [
          proposalId,
          proposalsVotingStateResult[i],
        ])
      );
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
