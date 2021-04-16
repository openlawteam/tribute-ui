import {AbiItem} from 'web3-utils/types';
import {Contract} from 'web3-eth-contract/types';

import {AsyncStatus} from '../../../util/types';
import {useState} from 'react';
import {VotingAdapterName} from '../../adapters-extensions/enums';

type VotingAdapterData = {
  votingAdapterName: VotingAdapterName;
  votingAdapterAddress: string;
  votingAdapterABI: AbiItem[];
  // Helper to use the Web3 Contract directly
  getWeb3VotingAdapterContract: () => Contract;
};

type ProposalVotingAdapterTuple = [
  proposalId: string,
  votingAdapterData: VotingAdapterData
];

type UseProposalsVotingAdapterReturn = {
  proposalsVotingAdapters: ProposalVotingAdapterTuple[];
  proposalsVotingAdaptersError: Error | undefined;
  proposalsVotingAdaptersStatus: AsyncStatus;
};

export function useProposalsVotingAdapter(
  proposalIds: string[]
): UseProposalsVotingAdapterReturn {
  /**
   * State
   */

  const [proposalsVotingAdapters, setProposalsVotingAdapters] = useState<
    UseProposalsVotingAdapterReturn['proposalsVotingAdapters']
  >([]);

  const [
    proposalsVotingAdaptersError,
    setProposalsVotingAdaptersError,
  ] = useState<
    UseProposalsVotingAdapterReturn['proposalsVotingAdaptersError']
  >();

  const [
    proposalsVotingAdaptersStatus,
    setProposalsVotingAdaptersStatus,
  ] = useState<
    UseProposalsVotingAdapterReturn['proposalsVotingAdaptersStatus']
  >(AsyncStatus.STANDBY);

  return {
    proposalsVotingAdapters,
    proposalsVotingAdaptersError,
    proposalsVotingAdaptersStatus,
  };
}
