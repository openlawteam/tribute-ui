import {ProposalFlowStatus, ProposalData} from '../types';
import {useOffchainVotingStartEnd} from '.';

export function useProposalFlowStatus(
  proposal: ProposalData
): ProposalFlowStatus | undefined {
  const {
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  // Status: Sponsor
  // @todo Check dao proposal data if submitted but not sponsored
  if (offchainVotingStartEndInitReady && !hasOffchainVotingStarted) {
    return ProposalFlowStatus.Sponsor;
  }

  // Status: OffchainVoting
  // @todo Check dao proposal data if sponsored
  // @todo Check if not in on-chain voting
  if (
    offchainVotingStartEndInitReady &&
    hasOffchainVotingStarted &&
    !hasOffchainVotingEnded
  ) {
    return ProposalFlowStatus.OffchainVoting;
  }

  // Status: Ready to Submit Vote Result
  // @todo Check if not in on-chain voting
  if (hasOffchainVotingEnded) {
    return ProposalFlowStatus.OffchainVotingSubmitResult;
  }

  // @todo How to know vote result submitted?
}
