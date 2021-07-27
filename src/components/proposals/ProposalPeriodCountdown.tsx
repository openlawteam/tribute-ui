import {useEffect, useState} from 'react';

import {getTimeRemaining} from '../../util/helpers';

export type RenderCountdownTextProps = {
  formatTimePeriod: typeof formatTimePeriod;
  showDaysOnly?: boolean;
} & Pick<
  ReturnType<typeof getTimeRemaining>,
  'days' | 'hours' | 'minutes' | 'seconds'
>;

type ProposalPeriodCountdownProps = {
  endedLabel?: React.ReactNode;
  endLabel?: React.ReactNode;
  endPeriodMs: number;
  renderCountdownText?: (p: RenderCountdownTextProps) => React.ReactNode;
  startLabel?: React.ReactNode;
  startPeriodMs: number;
};

function displayCountdown({
  countdownFrom,
  renderCountdownText,
  showDaysOnly,
}: {
  countdownFrom: Date;
  renderCountdownText?: ProposalPeriodCountdownProps['renderCountdownText'];
  showDaysOnly?: boolean;
}): string | React.ReactNode {
  const {days, hours, minutes, seconds} = getTimeRemaining(countdownFrom);

  const renderedCountdownText = renderCountdownText?.({
    days,
    formatTimePeriod,
    hours,
    minutes,
    seconds,
    showDaysOnly,
  });

  const format = formatTimePeriod;

  // Custom
  if (renderedCountdownText) {
    return renderedCountdownText;
  }

  // days
  if (days > 2 && showDaysOnly) {
    return `~${days} days`;
  }

  // days : hrs : min
  if (days > 0) {
    return `${format(days, 'day')} : ${format(hours, 'hr')} : ${format(
      minutes,
      'min'
    )}`;
  }

  // hrs : min
  if (hours > 0) {
    return `${format(hours, 'hr')} : ${format(minutes, 'min')}`;
  }

  // min : sec
  if (minutes > 0) {
    return `${format(minutes, 'min')} : ${format(seconds, 'sec')}`;
  }

  // sec
  return <span className="color-brightsalmon">{format(seconds, 'sec')}</span>;
}

function formatTimePeriod(time: number, period: 'day' | 'hr' | 'min' | 'sec') {
  const formattedPeriod = time === 0 || time > 1 ? `${period}s` : period;

  return `${time} ${formattedPeriod}`;
}

export default function ProposalPeriodCountdown(
  props: ProposalPeriodCountdownProps
) {
  const {
    endedLabel,
    endLabel,
    endPeriodMs,
    renderCountdownText,
    startLabel,
    startPeriodMs,
  } = props;

  /**
   * State
   */

  const [currentDate, setCurrentDate] = useState<Date>();

  /**
   * Variables
   */

  const startDate: Date = new Date(startPeriodMs);
  const endDate: Date = new Date(endPeriodMs);

  /**
   * Effects
   */

  // Every current `Date` each 1000ms (1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return function cleanup() {
      clearInterval(interval);
    };
  }, []);

  /**
   * Render
   */

  if (!currentDate) return null;

  // If time period has not yet started
  if (currentDate < startDate) {
    return (
      <div>
        <span>
          <span className="votingstatus">{startLabel || 'Starts:'}</span>{' '}
          <span className="votingstatus__timer">
            {displayCountdown({
              countdownFrom: startDate,
              renderCountdownText,
              showDaysOnly: true,
            })}
          </span>
        </span>
      </div>
    );
  }

  // If time period is happening now
  if (currentDate < endDate) {
    return (
      <div>
        <span>
          <span className="votingstatus">{endLabel || 'Ends:'}</span>{' '}
          <span className="votingstatus__timer">
            {displayCountdown({countdownFrom: endDate, renderCountdownText})}
          </span>
        </span>
      </div>
    );
  }

  // Default fallthrough: time period has ended
  return (
    <div>
      <span className="votingstatus">{endedLabel || 'Ended'}</span>
    </div>
  );
}
