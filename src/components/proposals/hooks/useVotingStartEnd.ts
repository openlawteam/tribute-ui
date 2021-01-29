import {useEffect, useState} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {ProposalData} from '../types';
import {AsyncStatus} from '../../../util/types';

type UseVotingStartEndReturn = {
  hasVotingEnded: boolean;
  hasVotingStarted: boolean;
  /**
   * Informs if the initial async checks have run.
   * This helps to tame UI false-positives that can arise when
   * using only booleans to check status.
   */
  votingStartEndInitReady: boolean;
};

export function useVotingStartEnd(
  proposal: ProposalData
): UseVotingStartEndReturn {
  const {snapshotProposal} = proposal;

  /**
   * State
   */

  const [hasVotingStarted, setHasVotingStarted] = useState<boolean>(false);
  const [hasVotingEnded, setHasVotingEnded] = useState<boolean>(false);
  const [votingStartEndStatus, setVotingStartEndStatus] = useState<{
    start: AsyncStatus;
    end: AsyncStatus;
  }>({start: AsyncStatus.STANDBY, end: AsyncStatus.STANDBY});

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    if (
      snapshotProposal?.msg.type !== SnapshotType.proposal ||
      hasVotingStarted
    ) {
      setVotingStartEndStatus((s) => ({...s, start: AsyncStatus.FULFILLED}));

      return;
    }

    setVotingStartEndStatus((s) => ({...s, start: AsyncStatus.PENDING}));

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingStartEndStatus((s) => ({...s, start: AsyncStatus.FULFILLED}));

      const hasStartedCheck =
        Math.floor(Date.now() / 1000) > snapshotProposal.msg.payload.start;

      if (!hasStartedCheck) return;

      setHasVotingStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [
    hasVotingStarted,
    snapshotProposal?.msg.payload.start,
    snapshotProposal?.msg.type,
  ]);

  // Actively check if voting has ended
  useEffect(() => {
    if (
      snapshotProposal?.msg.type !== SnapshotType.proposal ||
      hasVotingEnded
    ) {
      setVotingStartEndStatus((s) => ({...s, end: AsyncStatus.FULFILLED}));

      return;
    }

    setVotingStartEndStatus((s) => ({...s, end: AsyncStatus.PENDING}));

    // Check if voting has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingStartEndStatus((s) => ({...s, end: AsyncStatus.FULFILLED}));

      const hasEndedCheck =
        Math.ceil(Date.now() / 1000) > snapshotProposal.msg.payload.end;

      if (!hasEndedCheck) return;

      setHasVotingEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [
    hasVotingEnded,
    snapshotProposal?.msg.payload.end,
    snapshotProposal?.msg.type,
  ]);

  return {
    hasVotingStarted,
    hasVotingEnded,
    votingStartEndInitReady: Object.values(votingStartEndStatus).every(
      (s) => s === AsyncStatus.FULFILLED
    ),
  };
}
