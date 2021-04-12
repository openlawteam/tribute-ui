import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
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
  proposalIds: string[]
): UseProposalsVotingStateReturn {
  /**
   * Selectors
   */

  const registryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );
  const votingAddress = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.contractAddress
  );
  const votingABI = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.abi
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

  const getProposalsVotingStateCached = useCallback(getProposalsVotingState, [
    proposalIds,
    registryAddress,
    votingABI,
    votingAddress,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getProposalsVotingStateCached();
  }, [getProposalsVotingStateCached]);

  /**
   * Functions
   */

  async function getProposalsVotingState() {
    if (
      !registryAddress ||
      !votingAddress ||
      !votingABI ||
      !proposalIds.length
    ) {
      return;
    }

    // Only use hex (more specifically `bytes32`) id's
    const safeProposalIds = proposalIds.filter(web3Instance.utils.isHexStrict);

    if (!safeProposalIds.length) {
      setProposalsVotingStateStatus(AsyncStatus.FULFILLED);

      return;
    }

    try {
      const votingResultAbi = votingABI.find((ai) => ai.name === 'voteResult');

      if (!votingResultAbi) {
        throw new Error(
          'No "voteResult" ABI function was found for the voting adapter.'
        );
      }

      const calls: MulticallTuple[] = safeProposalIds.map((id) => [
        votingAddress,
        votingResultAbi,
        [registryAddress, id],
      ]);

      setProposalsVotingStateStatus(AsyncStatus.PENDING);

      const proposalsVotingStateResult = await multicall({
        calls,
        web3Instance,
      });

      setProposalsVotingStateStatus(AsyncStatus.FULFILLED);
      setProposaslsVotingState(
        safeProposalIds.map((id, i) => [id, proposalsVotingStateResult[i]])
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
