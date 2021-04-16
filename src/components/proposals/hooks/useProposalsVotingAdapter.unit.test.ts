import {act, renderHook} from '@testing-library/react-hooks';
import {AsyncStatus} from '../../../util/types';

import {useProposalsVotingAdapter} from './useProposalsVotingAdapter';

describe('useProposalsVotingAdapter unit tests', () => {
  test('should return correct data', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(() =>
        useProposalsVotingAdapter([])
      );

      // Initial state
      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.STANDBY
      );
    });
  });
});
