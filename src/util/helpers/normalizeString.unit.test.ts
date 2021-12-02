import {normalizeString} from './normalizeString';

describe('normalizeString unit tests', () => {
  test('should return trimmed and lowercased string', () => {
    expect(normalizeString('  WOW  ')).toBe('wow');
    expect(normalizeString('WOW  ')).toBe('wow');
    expect(normalizeString('   WOW')).toBe('wow');
    expect(normalizeString('  ')).toBe('');
    expect(normalizeString('')).toBe('');
    expect(normalizeString()).toBe('');
  });
});
