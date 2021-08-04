import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {AsyncStatus} from '../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../test/helpers';
import {useMemberUnitsAtSnapshot} from './useMemberUnitsAtSnapshot';
import Wrapper from '../test/Wrapper';

describe('useMemberUnitsAtSnapshot unit tests', () => {
  const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;

  test('should return correct data when member has units at snapshot', async () => {
    let mockWebProvider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange, waitForNextUpdate} =
        await renderHook(
          () => useMemberUnitsAtSnapshot(DEFAULT_ETH_ADDRESS, 123),
          {
            wrapper: Wrapper,
            initialProps: {
              useInit: true,
              useWallet: true,
              getProps: (p) => {
                mockWebProvider = p.mockWeb3Provider;
                web3Instance = p.web3Instance;
              },
            },
          }
        );

      // Assert initial state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(STANDBY);

      await waitForNextUpdate();

      // Mock `getPriorAmount` response
      mockWebProvider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 123456)
      );

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert pending state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(PENDING);

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert fulfilled state
      expect(result.current.hasMembershipAtSnapshot).toBe(true);
      expect(result.current.memberUnitsAtSnapshot).toBe('123456');
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(FULFILLED);
    });
  });

  test('should return correct data when member has no units at snapshot', async () => {
    let mockWebProvider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange, waitForNextUpdate} =
        await renderHook(
          () => useMemberUnitsAtSnapshot(DEFAULT_ETH_ADDRESS, 123),
          {
            wrapper: Wrapper,
            initialProps: {
              useInit: true,
              useWallet: true,
              getProps: (p) => {
                mockWebProvider = p.mockWeb3Provider;
                web3Instance = p.web3Instance;
              },
            },
          }
        );

      // Assert initial state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(STANDBY);

      await waitForNextUpdate();

      // Mock `getPriorAmount` response
      mockWebProvider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', 0)
      );

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert pending state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(PENDING);

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert fulfilled state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe('0');
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(FULFILLED);
    });
  });

  test('should return correct data when web3 error', async () => {
    let mockWebProvider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForValueToChange, waitForNextUpdate} =
        await renderHook(
          () => useMemberUnitsAtSnapshot(DEFAULT_ETH_ADDRESS, 123),
          {
            wrapper: Wrapper,
            initialProps: {
              useInit: true,
              useWallet: true,
              getProps: (p) => {
                mockWebProvider = p.mockWeb3Provider;
              },
            },
          }
        );

      // Assert initial state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(STANDBY);

      await waitForNextUpdate();

      // Mock web3 error response
      mockWebProvider.injectError({code: 1234, message: 'Some bad error'});

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert pending state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(PENDING);

      await waitForValueToChange(
        () => result.current.memberUnitsAtSnapshotStatus
      );

      // Assert fulfilled state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);

      expect(result.current.memberUnitsAtSnapshotError?.message).toMatch(
        /some bad error/i
      );

      expect(result.current.memberUnitsAtSnapshotStatus).toBe(REJECTED);
    });
  });
});
