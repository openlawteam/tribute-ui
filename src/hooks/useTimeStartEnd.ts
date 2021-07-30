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

function areAllAsyncReady(asyncMapping: Record<string, AsyncStatus>) {
  return Object.values(asyncMapping).every((s) => s === AsyncStatus.FULFILLED);
}

/**
 * Provides `boolean` results when time starts and ends.
 *
 * If either `startSeconds` or `endSeconds` are `undefined`, or `<= 0`
 * the checks will never run; only `timeStartEndInitReady` will ever be `true`.
 *
 * @param startSeconds
 * @param endSeconds
 * @returns `UseTimeStartEndReturn`
 */
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
    areAllAsyncReady(startEndStatusRef.current)
  );

  /**
   * Variables
   */

  const shouldNotCheck: boolean =
    startSeconds === undefined ||
    endSeconds === undefined ||
    startSeconds <= 0 ||
    endSeconds <= 0;

  /**
   * Effects
   */

  // Actively check if time has started
  useEffect(() => {
    if (hasTimeStarted || shouldNotCheck) {
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return areAllAsyncReady(startEndStatusRef.current);
      });

      return;
    }

    setTimeStartEndInitReady(() => {
      startEndStatusRef.current.start = AsyncStatus.PENDING;
      return areAllAsyncReady(startEndStatusRef.current);
    });

    // Check if time has started every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.start = AsyncStatus.FULFILLED;
        return areAllAsyncReady(startEndStatusRef.current);
      });

      const hasStartedCheck: boolean =
        Math.floor(Date.now() / 1000) > (startSeconds ?? 0);

      if (!hasStartedCheck) return;

      setHasTimeStarted(hasStartedCheck);
    }, 1000);

    return function cleanup() {
      if (intervalID) {
        clearInterval(intervalID);
      }
    };
  }, [hasTimeStarted, shouldNotCheck, startSeconds]);

  // Actively check if time has ended
  useEffect(() => {
    if (hasTimeEnded || shouldNotCheck) {
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return areAllAsyncReady(startEndStatusRef.current);
      });

      return;
    }

    setTimeStartEndInitReady(() => {
      startEndStatusRef.current.end = AsyncStatus.PENDING;
      return areAllAsyncReady(startEndStatusRef.current);
    });

    // Check if time has ended every 1 second
    const intervalID = setInterval(() => {
      // Async process ran
      setTimeStartEndInitReady(() => {
        startEndStatusRef.current.end = AsyncStatus.FULFILLED;
        return areAllAsyncReady(startEndStatusRef.current);
      });

      const hasEndedCheck: boolean =
        Math.ceil(Date.now() / 1000) > (endSeconds ?? 0);

      if (!hasEndedCheck) return;

      setHasTimeEnded(hasEndedCheck);
    }, 1000);

    return function cleanup() {
      if (intervalID) {
        clearInterval(intervalID);
      }
    };
  }, [endSeconds, hasTimeEnded, shouldNotCheck]);

  return {
    hasTimeStarted,
    hasTimeEnded,
    timeStartEndInitReady,
  };
}
