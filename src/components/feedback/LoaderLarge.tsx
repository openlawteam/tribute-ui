import {useState, useEffect} from 'react';

type LoaderLargeProps = {
  // Show waiting effect after some time has elapsed. Prevents the "sudden
  // spinner" UI/UX no-no. Esp. if we could have cached data.
  showAfterMs?: number;
};

export default function LoaderLarge(props: LoaderLargeProps) {
  const {showAfterMs} = props;
  const [showLoaderAfterMs, setShowLoaderAfterMs] = useState<boolean>(false);

  useEffect(() => {
    /* 200ms is approx. the time a user will notice a stalled, blank screen */
    const timeoutId =
      showAfterMs && setTimeout(() => setShowLoaderAfterMs(true), showAfterMs);

    return function cleanup() {
      timeoutId && clearTimeout(timeoutId);
    };
  }, [showAfterMs]);

  return !showAfterMs || (showAfterMs && showLoaderAfterMs) ? (
    <div className="loader--large" aria-label="Loading content..." />
  ) : null;
}
