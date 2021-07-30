import {calculateVotingTimeRanges} from './calculateVotingTimeRanges';

describe('calculateVotingTimeRanges unit tests', () => {
  const MS_MULTIPLIER: number = 1000;
  const nowSeconds: number = Math.floor(Date.now() / 1000);
  const oneDaySeconds: number = 86400;
  const oneDaySecondsString: string = oneDaySeconds.toString();
  const threeDaySecondsString: string = (oneDaySeconds * 3).toString();
  const defaultVotingStartingTime: string = nowSeconds.toFixed();

  const defaultGracePeriodStartingTime: string = (
    nowSeconds + oneDaySeconds
  ).toFixed();

  test('should return correct time ranges', () => {
    // Assert normal
    expect(
      calculateVotingTimeRanges({
        gracePeriodLength: oneDaySecondsString,
        gracePeriodStartingTime: defaultGracePeriodStartingTime,
        votePeriodLength: threeDaySecondsString,
        voteStartingTime: defaultVotingStartingTime,
      })
    ).toEqual({
      gracePeriodEndMs: (nowSeconds + oneDaySeconds * 2) * MS_MULTIPLIER,
      gracePeriodStartMs: (nowSeconds + oneDaySeconds) * MS_MULTIPLIER,
      voteEndMs: (nowSeconds + oneDaySeconds * 3) * MS_MULTIPLIER,
      voteStartMs: nowSeconds * MS_MULTIPLIER,
    });
  });

  test('should return correct time ranges when arguments are `undefined`', () => {
    // Assert all `0` time ranges
    expect(
      calculateVotingTimeRanges({
        gracePeriodLength: undefined,
        gracePeriodStartingTime: undefined,
        votePeriodLength: undefined,
        voteStartingTime: undefined,
      })
    ).toEqual({
      gracePeriodEndMs: 0,
      gracePeriodStartMs: 0,
      voteEndMs: 0,
      voteStartMs: 0,
    });
  });

  test('should return correct time ranges when `gracePeriodLength`, `votePeriodLength` are `undefined`', () => {
    // Assert each pair of time ranges are equivalent
    expect(
      calculateVotingTimeRanges({
        gracePeriodLength: undefined,
        gracePeriodStartingTime: defaultGracePeriodStartingTime,
        votePeriodLength: undefined,
        voteStartingTime: defaultVotingStartingTime,
      })
    ).toEqual({
      gracePeriodEndMs: (nowSeconds + oneDaySeconds) * MS_MULTIPLIER,
      gracePeriodStartMs: (nowSeconds + oneDaySeconds) * MS_MULTIPLIER,
      voteEndMs: nowSeconds * MS_MULTIPLIER,
      voteStartMs: nowSeconds * MS_MULTIPLIER,
    });
  });
});
