import {renderHook, act} from '@testing-library/react-hooks';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {snapshotAPIProposalResponse} from '../../../test/restResponses';
import {useGovernanceProposals} from './useGovernanceProposals';

describe('useGovernanceProposals unit tests', () => {
  test('should return correct data', async () => {
    await act(async () => {
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:actionId`,
            async (_req, res, ctx) => res(ctx.json(snapshotAPIProposalResponse))
          ),
        ]
      );

      const {result, waitForNextUpdate} = await renderHook(() =>
        useGovernanceProposals({actionId: BURN_ADDRESS})
      );

      expect(result.current.governanceProposals).toMatchObject([]);
      expect(result.current.governanceProposalsError).toBe(undefined);
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      expect(result.current.governanceProposals).toMatchObject([]);
      expect(result.current.governanceProposalsError).toBe(undefined);
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.PENDING
      );

      await waitForNextUpdate();

      expect(
        result.current.governanceProposals[0].snapshotProposal
      ).toMatchObject({
        ...Object.values(snapshotAPIProposalResponse)[0],
        idInSnapshot: Object.keys(snapshotAPIProposalResponse)[0],
        idInDAO: '',
      });
      expect(result.current.governanceProposalsError).toBe(undefined);
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });
  });

  test('should return error', async () => {
    await act(async () => {
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposals/:actionId`,
            async (_req, res, ctx) => res(ctx.status(500))
          ),
        ]
      );

      const {result, waitForNextUpdate} = await renderHook(() =>
        useGovernanceProposals({actionId: BURN_ADDRESS})
      );

      expect(result.current.governanceProposals).toMatchObject([]);
      expect(result.current.governanceProposalsError).toBe(undefined);
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      expect(result.current.governanceProposals).toMatchObject([]);
      expect(result.current.governanceProposalsError).toBe(undefined);
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.PENDING
      );

      await waitForNextUpdate();

      expect(result.current.governanceProposals).toMatchObject([]);
      expect(result.current.governanceProposalsError?.message).toMatch(
        /something went wrong while fetching the Snapshot proposals/i
      );
      expect(result.current.governanceProposalsStatus).toBe(
        AsyncStatus.REJECTED
      );
    });
  });
});
