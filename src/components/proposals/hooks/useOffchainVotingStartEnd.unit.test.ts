import {act, renderHook} from '@testing-library/react-hooks';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {ProposalData} from '../types';
import {useOffchainVotingStartEnd} from '.';

describe('useOffchainVotingStartEnd unit tests', () => {
  test('hook returns correct data throughout the voting period', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useOffchainVotingStartEnd({
          snapshotProposal: {
            msg: {
              payload: {start: nowSeconds, end: nowSeconds + 3},
              type: SnapshotType.proposal,
            },
          },
        } as ProposalData)
      );

      // Assert initial state
      expect(result.current.offchainVotingStartEndInitReady).toBe(false);
      expect(result.current.hasOffchainVotingStarted).toBe(false);
      expect(result.current.hasOffchainVotingEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.offchainVotingStartEndInitReady).toBe(true);
          expect(result.current.hasOffchainVotingStarted).toBe(true);
          expect(result.current.hasOffchainVotingEnded).toBe(false);
        },
        {timeout: 5000}
      );

      // await waitForNextUpdate();
      // await new Promise((r) => setTimeout(r, 100));

      await waitFor(
        () => {
          expect(result.current.offchainVotingStartEndInitReady).toBe(true);
          expect(result.current.hasOffchainVotingStarted).toBe(true);
          expect(result.current.hasOffchainVotingEnded).toBe(true);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide "true" if voting already started', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useOffchainVotingStartEnd({
          snapshotProposal: {
            msg: {
              payload: {start: nowSeconds - 1, end: nowSeconds + 3},
              type: SnapshotType.proposal,
            },
          },
        } as ProposalData)
      );

      // Assert initial state
      expect(result.current.offchainVotingStartEndInitReady).toBe(false);
      expect(result.current.hasOffchainVotingStarted).toBe(false);
      expect(result.current.hasOffchainVotingEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.offchainVotingStartEndInitReady).toBe(true);
          expect(result.current.hasOffchainVotingStarted).toBe(true);
          expect(result.current.hasOffchainVotingEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide "true" if voting already ended', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useOffchainVotingStartEnd({
          snapshotProposal: {
            msg: {
              payload: {start: nowSeconds - 180, end: nowSeconds - 5},
              type: SnapshotType.proposal,
            },
          },
        } as ProposalData)
      );

      // Assert initial state
      expect(result.current.offchainVotingStartEndInitReady).toBe(false);
      expect(result.current.hasOffchainVotingStarted).toBe(false);
      expect(result.current.hasOffchainVotingEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.offchainVotingStartEndInitReady).toBe(true);
          expect(result.current.hasOffchainVotingStarted).toBe(true);
          expect(result.current.hasOffchainVotingEnded).toBe(true);
        },
        {timeout: 5000}
      );
    });
  });

  test('should provide "false" if proposal is a draft / snapshotProposal does not exist', async () => {
    await act(async () => {
      const {result, waitFor} = await renderHook(() =>
        useOffchainVotingStartEnd({
          snapshotDraft: {
            msg: {
              payload: {},
              type: SnapshotType.draft,
            },
          },
        } as ProposalData)
      );

      // Assert initial state
      expect(result.current.offchainVotingStartEndInitReady).toBe(false);
      expect(result.current.hasOffchainVotingStarted).toBe(false);
      expect(result.current.hasOffchainVotingEnded).toBe(false);

      await waitFor(
        () => {
          expect(result.current.offchainVotingStartEndInitReady).toBe(true);
          expect(result.current.hasOffchainVotingStarted).toBe(false);
          expect(result.current.hasOffchainVotingEnded).toBe(false);
        },
        {timeout: 5000}
      );
    });
  });
});
