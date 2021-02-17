import React, {useState, useEffect, CSSProperties} from 'react';
import FadeIn from '../common/FadeIn';

type CycleEllipsisProps = {
  /**
   * What is the interval of cycling the message?
   */
  intervalMs?: number;
};

const MESSAGES = ['', '.', '.', '.'];
const rootStyles = {position: 'absolute'} as CSSProperties;

export function CycleEllipsis(props: CycleEllipsisProps) {
  const {intervalMs = 1000} = props;

  const [upToIndex, setUpToIndex] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(
      () => setUpToIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length),
      intervalMs
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return (
    <span style={rootStyles}>
      <span>{upToIndex >= 0 && MESSAGES[0]}</span>
      <span>{upToIndex >= 1 && <FadeIn inline>{MESSAGES[1]}</FadeIn>}</span>
      <span>{upToIndex >= 2 && <FadeIn inline>{MESSAGES[2]}</FadeIn>}</span>
      <span>{upToIndex >= 3 && <FadeIn inline>{MESSAGES[3]}</FadeIn>}</span>
    </span>
  );
}
