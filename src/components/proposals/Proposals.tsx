import {useEffect, useState} from 'react';
import {useProposalsVotingState} from './hooks';
import {ProposalData} from './types';

type ProposalsProps = {
  proposals: ProposalData[];
};

export default function Proposals(props: ProposalsProps): JSX.Element {
  const {proposals} = props;

  /**
   * State
   */

  const [proposalIds, setProposalIds] = useState<string[]>([]);
  const [votingProposals, setVotingProposals] = useState<string[]>([]);
  const requestProposals = useState<string[]>([]);
  const passedProposals = useState<string[]>([]);
  const failedProposals = useState<string[]>([]);

  /**
   * Our hooks
   */

  const {
    proposalsVotingState,
    proposalsVotingStateStatus,
  } = useProposalsVotingState(proposalIds);

  useEffect(() => {
    setProposalIds(
      proposals
        .map(
          (p) => p.snapshotDraft?.idInDAO || p.snapshotProposal?.idInDAO || ''
        )
        .filter(Boolean)
    );
  }, [proposals]);

  console.log('proposalsVotingState', proposalsVotingState);

  return <></>;
}
