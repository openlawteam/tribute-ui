import {formatNumberAbbreviated} from '.';

describe('formatNumberAbbreviated', () => {
  test('should return correct number abbreviations', () => {
    expect(formatNumberAbbreviated(0)).toBe('0');
    expect(formatNumberAbbreviated(1)).toBe('1');
    expect(formatNumberAbbreviated(10)).toBe('10');
    expect(formatNumberAbbreviated(100)).toBe('100');
    expect(formatNumberAbbreviated(1000)).toBe('1k');
    expect(formatNumberAbbreviated(10000)).toBe('10k');
    expect(formatNumberAbbreviated(100000)).toBe('100k');
    expect(formatNumberAbbreviated(1000000)).toBe('1M');
    expect(formatNumberAbbreviated(10000000)).toBe('10M');
    expect(formatNumberAbbreviated(100000000)).toBe('100M');
    expect(formatNumberAbbreviated(1000000000)).toBe('1B');
    expect(formatNumberAbbreviated(10000000000)).toBe('10B');
    expect(formatNumberAbbreviated(100000000000)).toBe('100B');
    expect(formatNumberAbbreviated(1000000000000)).toBe('1T');
    expect(formatNumberAbbreviated(10000000000000)).toBe('10T');
    expect(formatNumberAbbreviated(100000000000000)).toBe('100T');
    expect(formatNumberAbbreviated(1000000000000000)).toBe('1,000T');
  });
});
