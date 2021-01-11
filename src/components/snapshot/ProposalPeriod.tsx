import React, {useCallback, useEffect, useState} from 'react';

type ProposalPeriodProps = {
  startPeriod: Date;
  endPeriod: Date;
};

export default function ProposalPeriod(props: ProposalPeriodProps) {
  /**
   * Variables
   */

  const {startPeriod, endPeriod} = props;
  const getTimeRemaining = (endtime: Date) => {
    const t =
      Date.parse(endtime.toString()) - Date.parse(new Date().toString());
    const seconds = Math.floor((t / 1000) % 60);
    const minutes = Math.floor((t / 1000 / 60) % 60);
    const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    const days = Math.floor(t / (1000 * 60 * 60 * 24));

    return {
      total: t,
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    };
  };

  /**
   * State
   */

  const [proposalPeriod, setProposalPeriod] = useState<React.ReactNode>(null);

  /**
   * Cached callbacks
   */

  const displayCountdownCached = useCallback(displayCountdown, []);

  /**
   * Effects
   */

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date();
      if (currentDate < startPeriod) {
        const start = (
          <span>
            <span className="votingstatus">Starts:</span>{' '}
            <span className="votingstatus__timer">
              {displayCountdownCached(startPeriod, true)}
            </span>
          </span>
        );

        setProposalPeriod(start);
      } else if (currentDate < endPeriod) {
        const end = (
          <span>
            <span className="votingstatus">Ends:</span>{' '}
            <span className="votingstatus__timer">
              {displayCountdownCached(endPeriod)}
            </span>
          </span>
        );

        setProposalPeriod(end);
      } else {
        const ended = <span className="votingstatus">Ended</span>;

        setProposalPeriod(ended);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startPeriod, endPeriod, displayCountdownCached]);

  /**
   * Functions
   */

  function displayCountdown(countdown: Date, showDaysOnly?: boolean) {
    const {days, hours, minutes, seconds} = getTimeRemaining(countdown);

    if (days > 2 && showDaysOnly) {
      return `~${days} days`;
    } else if (days > 0) {
      return `${formatTimePeriod(days, 'day')} : ${formatTimePeriod(
        hours,
        'hr'
      )} : ${formatTimePeriod(minutes, 'min')}`;
    } else if (hours > 0) {
      return `${formatTimePeriod(hours, 'hr')} : ${formatTimePeriod(
        minutes,
        'min'
      )}`;
    } else if (minutes > 0) {
      return `${formatTimePeriod(minutes, 'min')} : ${formatTimePeriod(
        seconds,
        'sec'
      )}`;
    } else {
      return React.createElement(
        'span',
        {className: 'color-brightsalmon'},
        `${formatTimePeriod(seconds, 'sec')}`
      );
    }
  }

  function formatTimePeriod(time: number, period: string) {
    const formattedPeriod = time === 0 || time > 1 ? `${period}s` : period;

    return `${time} ${formattedPeriod}`;
  }

  /**
   * Render
   */

  return <div>{proposalPeriod}</div>;
}
