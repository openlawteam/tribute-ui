import {useEffect, useRef, useState} from 'react';

import {AsyncStatus} from '../util/types';

type UseTimeStartEndReturn = {
  hasTimeEnded: boolean;
  hasTimeStarted: boolean;
  /**
   * Informs if the initial async checks have run.
   * This helps to tame UI false-positives that can arise when
   * using only booleans to check status.
   */
  timeStartEndInitReady: boolean;
};

type StartEndStatus = {start: AsyncStatus; end: AsyncStatus};

export function useTimeStartEnd(
  startSeconds: number | undefined,
  endSeconds: number | undefined
): UseTimeStartEndReturn {
  /**
   * Refs
   */

  const startEndStatusRef = useRef<StartEndStatus>({
    start: AsyncStatus.STANDBY,
    end: AsyncStatus.STANDBY,
  });

  /**
   * State
   */

  const [hasTimeStarted, setHasTimeStarted] = useState<boolean>(false);

  const [hasTimeEnded, setHasTimeEnded] = useState<boolean>(false);

  const [timeStartEndInitReady, setTimeStartEndInitReady] = useState<boolean>(
    isInitReady(startEndStatusRef.current)
  );

  /**
   * Effects
   */

  // Actively check if time has started
  useEffect(() => {
    if (
      hasTimeStarted ||
      startSeconds === undefined ||
      endSeconds === undefined
    ) {
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(startEndStatusRef.current);
      });

      return;
    }

    setTimeStartEndInitReady(() => {
      startEndStatusRef.current.start = AsyncStatus.PENDING;
      return isInitReady(startEndStatusRef.current);
    });

    // Check if time has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return isInitReady(startEndStatusRef.current);
      });

      const hasStartedCheck = Math.floor(Date.now() / 1000) > startSeconds;

      if (!hasStartedCheck) return;

      setHasTimeStarted(hasStartedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [endSeconds, hasTimeStarted, startSeconds]);

  // Actively check if time has ended
  useEffect(() => {
    if (
      hasTimeEnded ||
      startSeconds === undefined ||
      endSeconds === undefined
    ) {
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(startEndStatusRef.current);
      });

      return;
    }

    setTimeStartEndInitReady(() => {
      startEndStatusRef.current.end = AsyncStatus.PENDING;
      return isInitReady(startEndStatusRef.current);
    });

    // Check if time has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return isInitReady(startEndStatusRef.current);
      });

      const hasEndedCheck = Math.ceil(Date.now() / 1000) > endSeconds;

      if (!hasEndedCheck) return;

      setHasTimeEnded(hasEndedCheck);
    }, 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, [endSeconds, hasTimeEnded, startSeconds]);

  /**
   * Functions
   */

  function isInitReady(timeStartEndInitReady: StartEndStatus) {
    return Object.values(timeStartEndInitReady).every(
      (s) => s === AsyncStatus.FULFILLED
    );
  }

  return {
    hasTimeStarted,
    hasTimeEnded,
    timeStartEndInitReady,
  };
}
