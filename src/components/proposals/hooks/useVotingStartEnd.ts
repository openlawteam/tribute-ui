import {useEffect, useState} from 'react';
import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {ProposalCombined, ProposalOrDraftSnapshotData} from '../types';

type UseVotingStartEndReturn = {
  hasVotingEnded: boolean;
  hasVotingStarted: boolean;
};

export function useVotingStartEnd<T extends ProposalOrDraftSnapshotData>(
  proposal: ProposalCombined<T>
): UseVotingStartEndReturn {
  /**
   * State
   */

  const [hasVotingStarted, setHasVotingStarted] = useState<boolean>(false);
  const [hasVotingEnded, setHasVotingEnded] = useState<boolean>(false);

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    if (proposal.snapshotProposal.msg.type !== SnapshotType.proposal) return;

    // If the value is already `true`, then exit.
    if (hasVotingStarted) return;

    const {
      snapshotProposal,
    } = proposal as ProposalCombined<SnapshotProposalResponseData>;

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      const hasStartedCheck =
        Math.floor(Date.now() / 1000) > snapshotProposal.msg.payload.start;

      if (!hasStartedCheck) return;

      setHasVotingStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [hasVotingStarted, proposal]);

  // Actively check if voting has ended
  useEffect(() => {
    if (proposal.snapshotProposal.msg.type !== SnapshotType.proposal) return;

    // If the value is already `true`, then exit.
    if (hasVotingEnded) return;

    const {
      snapshotProposal,
    } = proposal as ProposalCombined<SnapshotProposalResponseData>;

    // Check if voting has ended every 1 second
    const intervalID = setInterval(() => {
      const hasEndedCheck =
        Math.ceil(Date.now() / 1000) > snapshotProposal.msg.payload.end;

      if (!hasEndedCheck) return;

      setHasVotingEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [hasVotingEnded, proposal]);

  return {hasVotingStarted, hasVotingEnded};
}
