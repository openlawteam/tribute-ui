type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

const DEFAULT_REMAINING: TimeRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  total: 0,
};

export function getTimeRemaining(endTime: Date): TimeRemaining {
  const nowDate: Date = new Date();

  if (endTime <= nowDate) {
    return DEFAULT_REMAINING;
  }

  const total: number = endTime.getTime() - nowDate.getTime();
  const seconds: number = Math.floor((total / 1000) % 60);
  const minutes: number = Math.floor((total / 1000 / 60) % 60);
  const hours: number = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days: number = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    total,
  };
}
