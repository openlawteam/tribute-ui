import {getTimeRemaining} from './getTimeRemaining';

const ONE_DAY_MS: number = 86400 * 1000;

describe('getTimeRemaining unit tests', () => {
  test('should return correct data for days into future', () => {
    expect(
      getTimeRemaining(new Date(Date.now() + (ONE_DAY_MS + 2000 * 1000) * 2))
    ).toEqual({
      days: 2,
      hours: 1,
      minutes: 6,
      seconds: 40,
      total: 176800000,
    });
  });

  test('should return correct data for hours into future', () => {
    expect(
      getTimeRemaining(new Date(Date.now() + ONE_DAY_MS - 2000 * 1000))
    ).toEqual({
      days: 0,
      hours: 23,
      minutes: 26,
      seconds: 40,
      total: 84400000,
    });
  });

  test('should return correct data for minutes into future', () => {
    expect(getTimeRemaining(new Date(Date.now() + 60000 * 2 - 2000))).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 58,
      total: 118000,
    });
  });

  test('should return correct data for seconds into future', () => {
    expect(getTimeRemaining(new Date(Date.now() + 10000))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 10,
      total: 10000,
    });
  });

  test('should return correct data for now', () => {
    expect(getTimeRemaining(new Date(Date.now()))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    });
  });

  test('should return correct data for date in past', () => {
    expect(getTimeRemaining(new Date(Date.now() - ONE_DAY_MS))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    });
  });
});
