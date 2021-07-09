import {act, renderHook} from '@testing-library/react-hooks';

import {useVotingTimeStartEnd} from '.';

describe('useVotingTimeStartEnd unit tests', () => {
  test('hook returns correct data throughout the voting period', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(nowSeconds, nowSeconds + 3)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(true);
          expect(result.current.hasVotingTimeEnded).toBe(false);
        },
        {timeout: 5000}
      );

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(true);
          expect(result.current.hasVotingTimeEnded).toBe(true);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide "true" if voting already started', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(nowSeconds - 1, nowSeconds + 3)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(true);
          expect(result.current.hasVotingTimeEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide "true" if voting already ended', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(nowSeconds - 180, nowSeconds - 5)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(true);
          expect(result.current.hasVotingTimeEnded).toBe(true);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide correct result if start and end seconds are both "undefined"', async () => {
    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(undefined, undefined)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(false);
          expect(result.current.hasVotingTimeEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide correct result if start seconds is "undefined"', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(undefined, nowSeconds - 1)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(false);
          expect(result.current.hasVotingTimeEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide correct result if end seconds is "undefined"', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useVotingTimeStartEnd(nowSeconds - 1, undefined)
      );

      // Assert initial state
      expect(result.current.votingTimeStartEndInitReady).toBe(false);
      expect(result.current.hasVotingTimeStarted).toBe(false);
      expect(result.current.hasVotingTimeEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.votingTimeStartEndInitReady).toBe(true);
          expect(result.current.hasVotingTimeStarted).toBe(false);
          expect(result.current.hasVotingTimeEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });
});
