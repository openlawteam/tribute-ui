import {useState, useEffect, useRef} from 'react';

type UseAbortControllerReturn = {
  abortController: AbortController | undefined;
  isMountedRef: React.MutableRefObject<boolean>;
};

/**
 * useAbortController
 *
 * Provides an `AbortController` to cancel requests.
 * Also provides a helper `isMountedRef` to see if the React component has
 * been unmounted and therefore should not run any setting of state.
 */
export function useAbortController(): UseAbortControllerReturn {
  /**
   * State
   */

  const [abortController, setAbortController] = useState<AbortController>();

  /**
   * Refs
   */

  const isMountedRef = useRef<boolean>(false);

  /**
   * Effects
   */

  useEffect(() => {
    isMountedRef.current = true;

    !abortController && setAbortController(new AbortController());

    return () => {
      isMountedRef.current = false;

      abortController && abortController.abort();
    };
  }, [abortController]);

  return {
    abortController,
    isMountedRef,
  };
}
