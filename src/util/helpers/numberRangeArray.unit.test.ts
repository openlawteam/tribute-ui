import {numberRangeArray} from './numberRangeArray';

describe('numberRangeArray unit tests', () => {
  test('should return correct array', () => {
    expect(numberRangeArray(-1, 0)).toMatchObject([]);
    expect(numberRangeArray(2, 0)).toMatchObject([0, 1, 2]);
    expect(numberRangeArray(5, 1)).toMatchObject([1, 2, 3, 4, 5]);
    expect(numberRangeArray(5, 4)).toMatchObject([4, 5]);
    expect(numberRangeArray(5, 5)).toMatchObject([5]);
  });

  test('should return error when `(size + 1) < startAt`', () => {
    expect(() => numberRangeArray(-2, 0)).toThrow();
    expect(() => numberRangeArray(0, 2)).toThrow();
    expect(() => numberRangeArray(25, 27)).toThrow();
    expect(() => numberRangeArray(5, 10)).toThrow();
    expect(() => numberRangeArray(6, 27)).toThrow();
  });
});
