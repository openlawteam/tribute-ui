import {formatNumber} from '.';

describe('formatNumber unit tests', () => {
  test('should return en-US locale, comma-separated `String`', () => {
    // Assert number->string
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(10)).toBe('10');
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(10000000000)).toBe('10,000,000,000');

    // Assert string->string
    expect(formatNumber('0')).toBe('0');
    expect(formatNumber('10')).toBe('10');
    expect(formatNumber('100')).toBe('100');
    expect(formatNumber('1000')).toBe('1,000');
    expect(formatNumber('10000000000')).toBe('10,000,000,000');
  });

  test('if NaN, should return empty `String`', () => {
    // Assert number->string
    expect(formatNumber(undefined as any)).toBe('');
    expect(formatNumber(null as any)).toBe('');
  });
});
