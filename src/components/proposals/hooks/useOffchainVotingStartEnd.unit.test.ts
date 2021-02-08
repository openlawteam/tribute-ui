import {renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {ProposalData} from '../types';
import {useOffchainVotingStartEnd} from '.';

describe('useOffchainVotingStartEnd unit tests', () => {
  test('hook returns correct data throughout the voting period', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const {result, waitForNextUpdate} = await renderHook(() =>
      useOffchainVotingStartEnd({
        snapshotProposal: {
          msg: {
            payload: {start: nowSeconds, end: nowSeconds + 2},
            type: SnapshotType.proposal,
          },
        },
      } as ProposalData)
    );

    // Assert initial state
    expect(result.current.offchainVotingStartEndInitReady).toBe(false);
    expect(result.current.hasOffchainVotingStarted).toBe(false);
    expect(result.current.hasOffchainVotingEnded).toBe(false);

    await waitForNextUpdate();

    // Assert initial state
    expect(result.current.offchainVotingStartEndInitReady).toBe(true);
    expect(result.current.hasOffchainVotingStarted).toBe(true);
    expect(result.current.hasOffchainVotingEnded).toBe(false);

    await waitForNextUpdate();

    // Assert initial state
    expect(result.current.offchainVotingStartEndInitReady).toBe(true);
    expect(result.current.hasOffchainVotingStarted).toBe(true);
    expect(result.current.hasOffchainVotingEnded).toBe(true);
  });

  test('should provide "true" if voting already started', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const {result, waitForNextUpdate} = await renderHook(() =>
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

    await waitForNextUpdate();

    expect(result.current.offchainVotingStartEndInitReady).toBe(true);
    expect(result.current.hasOffchainVotingStarted).toBe(true);
    expect(result.current.hasOffchainVotingEnded).toBe(false);
  });

  test('should provide "true" if voting already ended', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const {result, waitForNextUpdate} = await renderHook(() =>
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

    await waitForNextUpdate();

    await waitFor(() => {
      expect(result.current.offchainVotingStartEndInitReady).toBe(true);
      expect(result.current.hasOffchainVotingStarted).toBe(true);
      expect(result.current.hasOffchainVotingEnded).toBe(true);
    });
  });

  test('should provide "false" if proposal is a draft / snapshotProposal does not exist', async () => {
    const {result} = await renderHook(() =>
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
    expect(result.current.offchainVotingStartEndInitReady).toBe(true);
    expect(result.current.hasOffchainVotingStarted).toBe(false);
    expect(result.current.hasOffchainVotingEnded).toBe(false);
  });
});
