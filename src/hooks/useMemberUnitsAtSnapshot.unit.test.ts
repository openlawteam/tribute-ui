import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {AsyncStatus} from '../util/types';
import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../test/helpers';
import {ethBlockNumber} from '../test/web3Responses';
import {useMemberUnitsAtSnapshot} from './useMemberUnitsAtSnapshot';
import Wrapper from '../test/Wrapper';

describe('useMemberUnitsAtSnapshot unit tests', () => {
  const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;

  test('should return correct data when member has units at snapshot', async () => {
    let mockWeb3Provider: FakeHttpProvider;
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
                mockWeb3Provider = p.mockWeb3Provider;
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

      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock `getPriorAmount` response
      mockWeb3Provider.injectResult(
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
    let mockWeb3Provider: FakeHttpProvider;
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
                mockWeb3Provider = p.mockWeb3Provider;
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

      // Mock `eth_blockNumber`
      mockWeb3Provider.injectResult(
        ...ethBlockNumber({result: 150, web3Instance})
      );

      // Mock `getPriorAmount` response
      mockWeb3Provider.injectResult(
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

  test('should return correct data when current block number not yet in past', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange, waitForNextUpdate} =
        await renderHook(
          () =>
            useMemberUnitsAtSnapshot(DEFAULT_ETH_ADDRESS, 123, {
              // Make the poll interval quicker for the test
              currentBlockPollIntervalMs: 2000,
            }),
          {
            wrapper: Wrapper,
            initialProps: {
              useInit: true,
              useWallet: true,
              getProps: (p) => {
                mockWeb3Provider = p.mockWeb3Provider;
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

      // Mock `eth_blockNumber` to be equal to the block to check
      mockWeb3Provider.injectResult(
        ...ethBlockNumber({result: 123, web3Instance})
      );

      // Mock `eth_blockNumber` to be 1 greater than the block to check
      mockWeb3Provider.injectResult(
        ...ethBlockNumber({result: 124, web3Instance})
      );

      // Mock `eth_blockNumber` to be 2 greater than the block to check
      mockWeb3Provider.injectResult(
        ...ethBlockNumber({result: 125, web3Instance})
      );

      // Mock `getPriorAmount` response
      mockWeb3Provider.injectResult(
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
        () => result.current.memberUnitsAtSnapshotStatus,
        {timeout: 5000}
      );

      // Assert fulfilled state
      expect(result.current.hasMembershipAtSnapshot).toBe(true);
      expect(result.current.memberUnitsAtSnapshot).toBe('123456');
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(FULFILLED);
    });
  });

  test('should return correct data when arguments `undefined`', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useMemberUnitsAtSnapshot(undefined, undefined),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(STANDBY);

      await waitForNextUpdate();

      // Assert pending state
      expect(result.current.hasMembershipAtSnapshot).toBe(false);
      expect(result.current.memberUnitsAtSnapshot).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotError).toBe(undefined);
      expect(result.current.memberUnitsAtSnapshotStatus).toBe(STANDBY);
    });
  });

  test('should return correct data when web3 error', async () => {
    let mockWeb3Provider: FakeHttpProvider;

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
                mockWeb3Provider = p.mockWeb3Provider;
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
      mockWeb3Provider.injectError({code: 1234, message: 'Some bad error'});

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
