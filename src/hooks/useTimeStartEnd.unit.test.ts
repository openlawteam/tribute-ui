import {act, renderHook} from '@testing-library/react-hooks';

import {useTimeStartEnd} from './useTimeStartEnd';

describe('useTimeStartEnd unit tests', () => {
  test('hook returns correct data throughout the time period', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds, nowSeconds + 3)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(true);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.hasTimeEnded, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(true);
      expect(result.current.hasTimeEnded).toBe(true);
    });
  });

  test('should provide "true" if time already started', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds - 1, nowSeconds + 3)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(true);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide "true" if time already ended', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds - 180, nowSeconds - 5)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(true);
      expect(result.current.hasTimeEnded).toBe(true);
    });
  });

  test('should provide correct result if start and end seconds are both `undefined`', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(undefined, undefined)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if start seconds is `undefined`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(undefined, nowSeconds - 1)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if end seconds is `undefined`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds - 1, undefined)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if start seconds is `0`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(0, nowSeconds - 1)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if end seconds is `0`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds - 1, 0)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if both start and end seconds are `0`', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(0, 0)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if start seconds is `< 0`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(-1, nowSeconds - 1)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if end seconds is `< 0`', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(nowSeconds - 1, -1)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });

  test('should provide correct result if both start and end seconds are `< 0`', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useTimeStartEnd(-2, -3)
      );

      // Assert initial state
      expect(result.current.timeStartEndInitReady).toBe(false);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);

      await waitForValueToChange(() => result.current.timeStartEndInitReady, {
        timeout: 3000,
      });

      expect(result.current.timeStartEndInitReady).toBe(true);
      expect(result.current.hasTimeStarted).toBe(false);
      expect(result.current.hasTimeEnded).toBe(false);
    });
  });
});
