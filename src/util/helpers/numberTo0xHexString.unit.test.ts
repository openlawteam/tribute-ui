import {numberTo0xHexString} from './numberTo0xHexString';

describe('numberTo0xHexString unit tests', () => {
  test('should return correct string', () => {
    expect(numberTo0xHexString(-1000)).toBe('0x3e8');
    expect(numberTo0xHexString(0)).toBe('0x0');
    expect(numberTo0xHexString(1000)).toBe('0x3e8');
    expect(numberTo0xHexString(NaN)).toBe(undefined);
    expect(numberTo0xHexString(Number('0x3e8'))).toBe('0x3e8');
    expect(numberTo0xHexString(undefined)).toBe(undefined);
  });
});
