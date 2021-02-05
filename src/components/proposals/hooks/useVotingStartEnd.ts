import {useEffect, useRef, useState} from 'react';
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

type StartEndStatus = {start: AsyncStatus; end: AsyncStatus};

export function useVotingStartEnd(
  proposal: ProposalData
): UseVotingStartEndReturn {
  const {snapshotProposal} = proposal;

  /**
   * Refs
   */

  const votingStartEndStatusRef = useRef<StartEndStatus>({
    start: AsyncStatus.STANDBY,
    end: AsyncStatus.STANDBY,
  });

  /**
   * State
   */

  const [hasVotingStarted, setHasVotingStarted] = useState<boolean>(false);
  const [hasVotingEnded, setHasVotingEnded] = useState<boolean>(false);
  const [
    votingStartEndInitReady,
    setVotingStartEndInitReady,
  ] = useState<boolean>(isInitReady(votingStartEndStatusRef.current));

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    if (
      snapshotProposal?.msg.type !== SnapshotType.proposal ||
      hasVotingStarted
    ) {
      setVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setVotingStartEndInitReady(() => {
      votingStartEndStatusRef.current.start = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

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
      setVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setVotingStartEndInitReady(() => {
      votingStartEndStatusRef.current.end = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

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

  /**
   * Functions
   */

  function isInitReady(votingStartEndInitReady: StartEndStatus) {
    return Object.values(votingStartEndInitReady).every(
      (s) => s === AsyncStatus.FULFILLED
    );
  }

  return {
    hasVotingStarted,
    hasVotingEnded,
    votingStartEndInitReady,
  };
}
