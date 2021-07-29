export function calculateVotingTimeRanges({
  gracePeriodLength,
  gracePeriodStartingTime,
  votePeriodLength,
  voteStartingTime,
}: {
  gracePeriodLength: string | undefined;
  gracePeriodStartingTime: string | undefined;
  votePeriodLength: string | undefined;
  voteStartingTime: string | undefined;
}): {
  gracePeriodEndMs: number;
  gracePeriodStartMs: number;
  voteEndMs: number;
  voteStartMs: number;
} {
  const MS_MULTIPLIER: number = 1000;
  const toNumber = (value: string | undefined): number => Number(value || 0);

  const gracePeriodStartMs: number =
    toNumber(gracePeriodStartingTime) * MS_MULTIPLIER;

  const voteStartMs: number = toNumber(voteStartingTime) * MS_MULTIPLIER;

  return {
    voteEndMs: voteStartMs + toNumber(votePeriodLength) * MS_MULTIPLIER,
    voteStartMs,
    gracePeriodEndMs:
      gracePeriodStartMs + toNumber(gracePeriodLength) * MS_MULTIPLIER,
    gracePeriodStartMs,
  };
}
