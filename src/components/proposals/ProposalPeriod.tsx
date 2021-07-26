import {useEffect, useState} from 'react';

import {getTimeRemaining} from '../../util/helpers';

type ProposalPeriodProps = {
  endedLabel?: React.ReactNode;
  endLabel?: React.ReactNode;
  endPeriodMs: number;
  startLabel?: React.ReactNode;
  startPeriodMs: number;
};

function displayCountdown(
  countdown: Date,
  showDaysOnly?: boolean
): string | React.ReactNode {
  const {days, hours, minutes, seconds} = getTimeRemaining(countdown);

  if (days > 2 && showDaysOnly) {
    return `~${days} days`;
  }

  if (days > 0) {
    return `${formatTimePeriod(days, 'day')} : ${formatTimePeriod(
      hours,
      'hr'
    )} : ${formatTimePeriod(minutes, 'min')}`;
  }

  if (hours > 0) {
    return `${formatTimePeriod(hours, 'hr')} : ${formatTimePeriod(
      minutes,
      'min'
    )}`;
  }

  if (minutes > 0) {
    return `${formatTimePeriod(minutes, 'min')} : ${formatTimePeriod(
      seconds,
      'sec'
    )}`;
  }

  return (
    <span className="color-brightsalmon">
      {formatTimePeriod(seconds, 'sec')}
    </span>
  );
}

function formatTimePeriod(time: number, period: string) {
  const formattedPeriod = time === 0 || time > 1 ? `${period}s` : period;

  return `${time} ${formattedPeriod}`;
}

export default function ProposalPeriod(props: ProposalPeriodProps) {
  const {startLabel, startPeriodMs, endLabel, endedLabel, endPeriodMs} = props;

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
            {displayCountdown(startDate, true)}
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
            {displayCountdown(endDate)}
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
