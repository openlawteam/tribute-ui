import {useSelector} from 'react-redux';
import {useEffect} from 'react';

import {ProposalFlowStatus, ProposalData, ProposalFlag} from '../types';
import {StoreState} from '../../../store/types';
import {useContractPoll} from '../../web3/hooks/useContractPoll';
import {useOffchainVotingStartEnd} from '.';
import {VotingState} from '../voting/types';

// @todo Stop polling votes once result submitted
// @todo Stop polling proposal once processed
// @todo Stop polling vote result once result submitted
// @todo Be able to fall back to on-chain polling this if subgraph is not available

type UseProposalWithOffchainVoteStatusReturn = {
  status: ProposalFlowStatus | undefined;
  daoProposal: {adapterAddress: string; flags: number} | undefined;
  daoProposalVotes:
    | {
        fallbackVotesCount: string;
        gracePeriodStartingTime: string;
        index: string;
        isChallenged: boolean;
        nbNo: string;
        nbVoters: string;
        nbYes: string;
        proposalHash: string;
        reporter: string;
        resultRoot: string;
        snapshot: string;
        startingTime: string;
      }
    | undefined;
  /**
   * An enum index (string) of the DAO proposal's `VotingState`
   */
  daoProposalVoteResult: string | undefined;
  transitionMessage: string | undefined;
};

export function useProposalWithOffchainVoteStatus(
  proposal: ProposalData
): UseProposalWithOffchainVoteStatusReturn {
  const {snapshotDraft, snapshotProposal} = proposal;
  const proposalId = snapshotDraft?.idInDAO || snapshotProposal?.idInDAO;

  /**
   * Selectors
   */

  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );
  const daoRegistryMethods = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.instance.methods
  );
  const offchainVotingMethods = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.instance.methods
  );

  /**
   * Our hooks
   */

  const {
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  const {
    pollContract: pollProposal,
    pollContractData: daoProposal,
  } = useContractPoll<UseProposalWithOffchainVoteStatusReturn['daoProposal']>({
    pollInterval: 5000,
  });

  const {
    pollContract: pollProposalVoteResult,
    pollContractData: daoProposalVoteResult,
  } = useContractPoll<
    UseProposalWithOffchainVoteStatusReturn['daoProposalVoteResult']
  >({
    pollInterval: 5000,
  });

  const {
    pollContract: pollProposalVotes,
    pollContractData: daoProposalVotes,
  } = useContractPoll<
    UseProposalWithOffchainVoteStatusReturn['daoProposalVotes']
  >({
    pollInterval: 5000,
  });

  /**
   * Variables
   */

  const atExistsInDAO = daoProposal
    ? ProposalFlag[daoProposal.flags] === ProposalFlag[ProposalFlag.EXISTS]
    : false;
  const atSponsoredInDAO = daoProposal
    ? ProposalFlag[daoProposal.flags] === ProposalFlag[ProposalFlag.SPONSORED]
    : false;
  const atProcessedInDAO = daoProposal
    ? ProposalFlag[daoProposal.flags] === ProposalFlag[ProposalFlag.PROCESSED]
    : false;

  /**
   * Check if vote result was submitted.
   * We can do this by checking if `reporter` and `resultRoot` has been set.
   *
   * @see `submitVoteResult` in laoland off-chain voting adapters
   */
  const offchainResultSubmitted =
    daoProposalVotes &&
    daoProposalVotes.reporter &&
    !daoProposalVotes.reporter.startsWith('0x00000000000') &&
    daoProposalVotes.resultRoot &&
    !daoProposalVotes.resultRoot.startsWith('0x00000000000');

  const isInVotingGracePeriod =
    daoProposalVoteResult &&
    VotingState[daoProposalVoteResult] ===
      VotingState[VotingState.GRACE_PERIOD];

  useEffect(() => {
    if (!daoRegistryMethods) return;

    pollProposal({
      methodName: 'proposals',
      methodArguments: [proposalId],
      contractInstanceMethods: daoRegistryMethods,
    });
  }, [daoRegistryMethods, pollProposal, proposalId]);

  useEffect(() => {
    if (!offchainVotingMethods || !daoRegistryAddress) return;

    pollProposalVoteResult({
      methodName: 'voteResult',
      methodArguments: [daoRegistryAddress, proposalId],
      contractInstanceMethods: offchainVotingMethods,
    });
  }, [
    daoRegistryAddress,
    offchainVotingMethods,
    pollProposalVoteResult,
    proposalId,
  ]);

  useEffect(() => {
    if (!offchainVotingMethods || !daoRegistryAddress) return;

    pollProposalVotes({
      methodName: 'votes',
      methodArguments: [daoRegistryAddress, proposalId],
      contractInstanceMethods: offchainVotingMethods,
    });
  }, [
    daoRegistryAddress,
    offchainVotingMethods,
    pollProposalVotes,
    proposalId,
  ]);

  /**
   * Functions
   */

  function getReturnData(
    status: ProposalFlowStatus | undefined,
    transitionMessage?: string
  ): UseProposalWithOffchainVoteStatusReturn {
    return {
      status,
      transitionMessage,
      daoProposal,
      daoProposalVoteResult,
      daoProposalVotes,
    };
  }

  // Status: Sponsor
  if (
    offchainVotingStartEndInitReady &&
    !hasOffchainVotingStarted &&
    atExistsInDAO
  ) {
    return getReturnData(ProposalFlowStatus.Sponsor);
  }

  // Status: Off-chain Voting
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingStarted &&
    !hasOffchainVotingEnded &&
    atSponsoredInDAO
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVoting);
  }

  // Status: Ready to Submit Vote Result
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    atSponsoredInDAO &&
    !offchainResultSubmitted
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingSubmitResult);
  }

  // Status: Grace period
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    atSponsoredInDAO &&
    offchainResultSubmitted &&
    isInVotingGracePeriod
  ) {
    return getReturnData(ProposalFlowStatus.OffchainVotingGracePeriod);
  }

  // Status: Process
  if (
    atSponsoredInDAO &&
    offchainVotingStartEndInitReady &&
    hasOffchainVotingEnded &&
    offchainResultSubmitted &&
    !isInVotingGracePeriod
  ) {
    return getReturnData(ProposalFlowStatus.Process);
  }

  // Status: Processed (completed)
  if (atProcessedInDAO) {
    return getReturnData(ProposalFlowStatus.Completed);
  }

  // Fallthrough
  return {
    status: undefined,
    transitionMessage: undefined,
    daoProposal,
    daoProposalVoteResult,
    daoProposalVotes,
  };
}
