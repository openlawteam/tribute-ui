import {useEffect, useRef, useState} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {ProposalData} from '../types';
import {AsyncStatus} from '../../../util/types';

type UseOffchainVotingStartEndReturn = {
  hasOffchainVotingEnded: boolean;
  hasOffchainVotingStarted: boolean;
  /**
   * Informs if the initial async checks have run.
   * This helps to tame UI false-positives that can arise when
   * using only booleans to check status.
   */
  offchainVotingStartEndInitReady: boolean;
};

type StartEndStatus = {start: AsyncStatus; end: AsyncStatus};

export function useOffchainVotingStartEnd(
  proposal: ProposalData
): UseOffchainVotingStartEndReturn {
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

  const [
    hasOffchainVotingStarted,
    setHasOffchainVotingStarted,
  ] = useState<boolean>(false);
  const [hasOffchainVotingEnded, setHasOffchainVotingEnded] = useState<boolean>(
    false
  );
  const [
    offchainVotingStartEndInitReady,
    setOffchainVotingStartEndInitReady,
  ] = useState<boolean>(isInitReady(votingStartEndStatusRef.current));

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    if (
      snapshotProposal?.msg.type !== SnapshotType.proposal ||
      hasOffchainVotingStarted
    ) {
      setOffchainVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setOffchainVotingStartEndInitReady(() => {
      votingStartEndStatusRef.current.start = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setOffchainVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      const hasStartedCheck =
        Math.floor(Date.now() / 1000) > snapshotProposal.msg.payload.start;

      if (!hasStartedCheck) return;

      setHasOffchainVotingStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [
    hasOffchainVotingStarted,
    snapshotProposal?.msg.payload.start,
    snapshotProposal?.msg.type,
  ]);

  // Actively check if voting has ended
  useEffect(() => {
    if (
      snapshotProposal?.msg.type !== SnapshotType.proposal ||
      hasOffchainVotingEnded
    ) {
      setOffchainVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setOffchainVotingStartEndInitReady(() => {
      votingStartEndStatusRef.current.end = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setOffchainVotingStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      const hasEndedCheck =
        Math.ceil(Date.now() / 1000) > snapshotProposal.msg.payload.end;

      if (!hasEndedCheck) return;

      setHasOffchainVotingEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [
    hasOffchainVotingEnded,
    snapshotProposal?.msg.payload.end,
    snapshotProposal?.msg.type,
  ]);

  /**
   * Functions
   */

  function isInitReady(offchainVotingStartEndInitReady: StartEndStatus) {
    return Object.values(offchainVotingStartEndInitReady).every(
      (s) => s === AsyncStatus.FULFILLED
    );
  }

  return {
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  };
}
