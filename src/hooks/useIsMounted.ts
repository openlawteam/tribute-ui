import {useEffect, useRef} from 'react';

type UseIsMountedReturn = {
  isMountedRef: React.MutableRefObject<boolean>;
};

/**
 * useIsMounted
 *
 * A hook that returns a React Ref which tells if the component is mounted, or not.
 * This is helpful when needing to stop state updates in hooks with effects.
 */
export function useIsMounted(): UseIsMountedReturn {
  /**
   * Refs
   */

  const isMountedRef = useRef<boolean>(false);

  /**
   * Effects
   */

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    isMountedRef,
  };
}
