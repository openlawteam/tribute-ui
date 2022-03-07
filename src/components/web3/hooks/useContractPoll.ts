import {useCallback, useEffect, useRef, useState} from 'react';
import {Contract} from 'web3-eth-contract/types';

type UseContractPollOptions = {
  initialCallBeforeWait?: boolean;
  pollInterval?: number;
};

type UseContractPollReturn<T> = {
  pollContract: (data: PollContractArgs) => void;
  pollContractData: T | undefined;
  pollContractError: Error | undefined;
  stopPollingContract: () => void;
};

type PollContractArgs = {
  methodName: string;
  contractInstanceMethods: typeof Contract.prototype.methods;
  methodArguments: any[];
};

export function useContractPoll<T>(
  options?: UseContractPollOptions
): UseContractPollReturn<T> {
  const {
    initialCallBeforeWait = true,
    pollInterval = 15000 /* 15 sec default */,
  } = options || {};

  /**
   * State
   */

  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollContractData, setPollContractData] = useState<T>();
  const [pollContractError, setPollContractError] = useState<Error>();
  const [stopPollingRequested, setStopPollingRequested] =
    useState<boolean>(false);

  /**
   * Cached callbacks
   */

  const callContractCached = useCallback(callContract, []);
  const pollContractCached = useCallback(pollContract, [
    callContractCached,
    initialCallBeforeWait,
    pollInterval,
  ]);
  const stopPollingContractCached = useCallback(stopPollingContract, []);

  /**
   * Refs
   */

  const intervalIdRef = useRef<NodeJS.Timeout>();

  /**
   * Effects
   */

  useEffect(() => {
    // Clean up on unmount
    return () => {
      intervalIdRef.current && clearInterval(intervalIdRef.current);
    };
  }, []);

  /**
   * Check if stop polling was requested
   * (`stopPollingContract` called but possibly before an interval could be set)
   */
  useEffect(() => {
    if (intervalIdRef.current && isPolling && stopPollingRequested) {
      clearInterval(intervalIdRef.current);
      setStopPollingRequested(false);
      setIsPolling(false);
    }
  }, [isPolling, stopPollingRequested]);

  /**
   * Functions
   */

  async function callContract({
    methodArguments,
    methodName,
    contractInstanceMethods,
  }: PollContractArgs): Promise<T> {
    try {
      const method = contractInstanceMethods[methodName];

      return await method(...methodArguments).call();
    } catch (error) {
      throw error;
    }
  }

  function pollContract(data: PollContractArgs): void {
    try {
      intervalIdRef.current && clearInterval(intervalIdRef.current);

      const intervalFunction = async () => {
        const responseData = await callContractCached(data);
        setPollContractData(responseData);
      };

      setIsPolling(true);

      initialCallBeforeWait && intervalFunction();

      const intervalIdToSet = setInterval(intervalFunction, pollInterval);

      intervalIdRef.current = intervalIdToSet;
    } catch (error) {
      const e = error as Error;

      setPollContractError(e);
    }
  }

  function stopPollingContract() {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      setIsPolling(false);

      return;
    }

    // Request stop
    setStopPollingRequested(true);
  }

  return {
    pollContract: pollContractCached,
    pollContractData,
    pollContractError,
    stopPollingContract: stopPollingContractCached,
  };
}
