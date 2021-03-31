import React, {useState, useEffect, CSSProperties} from 'react';
import FadeIn from '../common/FadeIn';

type CycleEllipsisProps = {
  ariaLabel?: string;
  /**
   * What is the interval of cycling the message?
   */
  intervalMs?: number;
  /**
   * Optional settings for the inner `<FadeIn />` component.
   */
  fadeInProps?: Parameters<typeof FadeIn>[0];
};

const MESSAGES = ['', '.', '.', '.'];
const rootStyles = {position: 'absolute'} as CSSProperties;
const nbspStyles = {
  height: 1,
  width: 1,
} as CSSProperties;

export function CycleEllipsis(props: CycleEllipsisProps) {
  const {ariaLabel, intervalMs = 1000, fadeInProps} = props;
  const fadeInPropsMerged = {...fadeInProps, inline: true};

  const [upToIndex, setUpToIndex] = useState<number>(1);

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
    <>
      <span aria-label={ariaLabel} style={rootStyles}>
        <span>{upToIndex >= 0 && MESSAGES[0]}</span>
        <span>
          {upToIndex >= 1 && (
            <FadeIn {...fadeInPropsMerged}>{MESSAGES[1]}</FadeIn>
          )}
        </span>
        <span>
          {upToIndex >= 2 && (
            <FadeIn {...fadeInPropsMerged}>{MESSAGES[2]}</FadeIn>
          )}
        </span>
        <span>
          {upToIndex >= 3 && (
            <FadeIn {...fadeInPropsMerged}>{MESSAGES[3]}</FadeIn>
          )}
        </span>
      </span>
      {/* @note Keep as it's an alignment fallback in certain CSS situations when no other text is a sibiling */}
      <span style={nbspStyles}>&nbsp;</span>
    </>
  );
}
