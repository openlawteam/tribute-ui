import {useEffect, useRef, useState} from 'react';

import {AsyncStatus} from '../util/types';

type UseVotingTimeStartEndReturn = {
  hasVotingTimeEnded: boolean;
  hasVotingTimeStarted: boolean;
  /**
   * Informs if the initial async checks have run.
   * This helps to tame UI false-positives that can arise when
   * using only booleans to check status.
   */
  votingTimeStartEndInitReady: boolean;
};

type StartEndStatus = {start: AsyncStatus; end: AsyncStatus};

export function useVotingTimeStartEnd(
  startSeconds: number | undefined,
  endSeconds: number | undefined
): UseVotingTimeStartEndReturn {
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

  const [hasVotingTimeStarted, setHasVotingTimeStarted] =
    useState<boolean>(false);

  const [hasVotingTimeEnded, setHasVotingTimeEnded] = useState<boolean>(false);

  const [votingTimeStartEndInitReady, setVotingTimeStartEndInitReady] =
    useState<boolean>(isInitReady(votingStartEndStatusRef.current));

  /**
   * Effects
   */

  // Actively check if voting has started
  useEffect(() => {
    if (
      hasVotingTimeStarted ||
      startSeconds === undefined ||
      endSeconds === undefined
    ) {
      setVotingTimeStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setVotingTimeStartEndInitReady(() => {
      votingStartEndStatusRef.current.start = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingTimeStartEndInitReady(() => {
        votingStartEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      const hasStartedCheck = Math.floor(Date.now() / 1000) > startSeconds;

      if (!hasStartedCheck) return;

      setHasVotingTimeStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [endSeconds, hasVotingTimeStarted, startSeconds]);

  // Actively check if voting has ended
  useEffect(() => {
    if (
      hasVotingTimeEnded ||
      startSeconds === undefined ||
      endSeconds === undefined
    ) {
      setVotingTimeStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      return;
    }

    setVotingTimeStartEndInitReady(() => {
      votingStartEndStatusRef.current.end = AsyncStatus.PENDING;
      return isInitReady(votingStartEndStatusRef.current);
    });

    // Check if voting has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setVotingTimeStartEndInitReady(() => {
        votingStartEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(votingStartEndStatusRef.current);
      });

      const hasEndedCheck = Math.ceil(Date.now() / 1000) > endSeconds;

      if (!hasEndedCheck) return;

      setHasVotingTimeEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [endSeconds, hasVotingTimeEnded, startSeconds]);

  /**
   * Functions
   */

  function isInitReady(votingTimeStartEndInitReady: StartEndStatus) {
    return Object.values(votingTimeStartEndInitReady).every(
      (s) => s === AsyncStatus.FULFILLED
    );
  }

  return {
    hasVotingTimeStarted,
    hasVotingTimeEnded,
    votingTimeStartEndInitReady,
  };
}
