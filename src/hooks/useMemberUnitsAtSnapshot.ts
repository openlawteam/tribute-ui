import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import {AsyncStatus} from '../util/types';
import {ENVIRONMENT, UNITS_ADDRESS} from '../config';
import {StoreState} from '../store/types';
import {useIsMounted} from './useIsMounted';
import {useWeb3Modal} from '../components/web3/hooks';

type UseMemberUnitsAtSnapshotReturn = {
  /**
   * Was the member to check a member of the DAO at the
   * requested snapshot?
   */
  hasMembershipAtSnapshot: boolean;
  /**
   * Member units as a `string`.
   * Convert to a `BigNumber`, if needed for calculation.
   */
  memberUnitsAtSnapshot: string | undefined;
  memberUnitsAtSnapshotError: Error | undefined;
  memberUnitsAtSnapshotStatus: AsyncStatus;
};

const {STANDBY, PENDING, FULFILLED, REJECTED} = AsyncStatus;

const DEFAULT_POLL_INTERVAL_MS: number =
  ENVIRONMENT === 'production' ? 15000 : 5000;

const DEFAULT_BLOCK_CHECK_OFFSET: number = 2;

/**
 * In order for `getPriorAmount` to return without reverting,
 * we must be sending a block number from the past.
 *
 * We must poll to wait until the block is in the past.
 * We could poll `getPriorAmount` until it does not revert, but
 * doing this could hide other errors.
 *
 * @param number `blockToCompare`
 * @param Web3 `web3Instance`
 * @returns `boolean`
 * @see `getPriorAmount` in `tribute-contracts`
 */
async function pollUntilBlockInPast({
  block,
  blockOffset = DEFAULT_BLOCK_CHECK_OFFSET,
  isMountedRef,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  web3Instance,
}: {
  block: number;
  blockOffset?: number;
  isMountedRef?: React.MutableRefObject<boolean>;
  pollInterval?: number;
  web3Instance: Web3;
}) {
  return new Promise<boolean>(async (resolve, reject) => {
    /**
     * Uses a positive block offset to check if the difference between `block` provided
     * and `currentBlock` is at least at or greater than the `blockOffset`.
     *
     * This is used to limit errors from `getPriorAmount` when the block is not in the past.
     * If we set an offset, it helps to mitigate issues where the fetched block number
     * and the `block.number in the contract are not yet aligned.
     */
    const blockOffsetCheck = (block: number, currentBlock: number): boolean => {
      const blockDifference: number = currentBlock - block;

      return blockDifference >= Math.abs(blockOffset);
    };

    // Check immediately
    try {
      if (blockOffsetCheck(block, await web3Instance.eth.getBlockNumber())) {
        resolve(true);

        return;
      }
    } catch (error) {
      reject(error);

      return;
    }

    // If the initial check did not succeed, begin to poll.
    const intervalId = setInterval(async () => {
      try {
        if (!isMountedRef?.current) {
          clearInterval(intervalId);

          return;
        }

        if (blockOffsetCheck(block, await web3Instance.eth.getBlockNumber())) {
          clearInterval(intervalId);
          resolve(true);
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    }, pollInterval);
  });
}

export function useMemberUnitsAtSnapshot(
  memberAddress: string | undefined,
  snapshot: number | undefined,
  options?: {
    blockCheckOffset?: number;
    currentBlockPollIntervalMs?: number;
  }
): UseMemberUnitsAtSnapshotReturn {
  const {blockCheckOffset, currentBlockPollIntervalMs} = options || {};

  /**
   * Selectors
   */

  const bankExtensionMethods = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.instance.methods
  );

  /**
   * State
   */

  const [memberUnitsAtSnapshot, setMemberUnitsAtSnapshot] = useState<string>();

  const [hasMembershipAtSnapshot, setHasMembershipAtSnapshot] =
    useState<boolean>(false);

  const [memberUnitsAtSnapshotError, setMemberUnitsAtSnapshotError] =
    useState<Error>();

  const [memberUnitsAtSnapshotStatus, setMemberUnitsAtSnapshotStatus] =
    useState<AsyncStatus>(STANDBY);

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();
  const {isMountedRef} = useIsMounted();

  /**
   * Cached Callbacks
   */

  const handleGetPriorUnitsAmountCached = useCallback(
    handleGetPriorUnitsAmount,
    [isMountedRef]
  );

  /**
   * Effects
   */

  useEffect(() => {
    // These parameters may be arriving async and not ready, yet.
    if (!memberAddress || !snapshot || !bankExtensionMethods || !web3Instance) {
      return;
    }

    handleGetPriorUnitsAmountCached({
      bankExtensionMethods,
      blockCheckOffset,
      currentBlockPollIntervalMs,
      memberAddress,
      snapshot,
      web3Instance,
    });
  }, [
    bankExtensionMethods,
    blockCheckOffset,
    currentBlockPollIntervalMs,
    handleGetPriorUnitsAmountCached,
    memberAddress,
    snapshot,
    web3Instance,
  ]);

  /**
   * Functions
   */

  async function handleGetPriorUnitsAmount({
    bankExtensionMethods,
    blockCheckOffset,
    currentBlockPollIntervalMs,
    memberAddress,
    snapshot,
    web3Instance,
  }: {
    bankExtensionMethods: any;
    blockCheckOffset?: number;
    currentBlockPollIntervalMs?: number;
    memberAddress: string;
    snapshot: number;
    web3Instance: Web3;
  }): Promise<void> {
    try {
      // Reset any error
      setMemberUnitsAtSnapshotError(undefined);
      setMemberUnitsAtSnapshotStatus(PENDING);

      /**
       * Poll until we are at a block in the past.
       *
       * For example, in governance votes, this can be an issue for anyone trying
       * to vote in the same block as the proposal's snapshot,
       * as `getPriorAmount` will revert if `blockToCheck >= block.number`.
       *
       * This is not an issue with on-chain proposals.
       */
      await pollUntilBlockInPast({
        block: snapshot,
        blockOffset: blockCheckOffset,
        isMountedRef,
        pollInterval: currentBlockPollIntervalMs,
        web3Instance,
      });

      const memberUnitsAtSnapshot: string = await bankExtensionMethods
        .getPriorAmount(memberAddress, UNITS_ADDRESS, snapshot)
        .call();

      if (!isMountedRef.current) return;

      setMemberUnitsAtSnapshot(memberUnitsAtSnapshot);

      setHasMembershipAtSnapshot(
        new BigNumber(memberUnitsAtSnapshot).isGreaterThan(new BigNumber(0))
      );

      setMemberUnitsAtSnapshotStatus(FULFILLED);
    } catch (error) {
      if (!isMountedRef.current) return;

      const e = error as Error;

      setHasMembershipAtSnapshot(false);
      setMemberUnitsAtSnapshot(undefined);
      setMemberUnitsAtSnapshotError(e);
      setMemberUnitsAtSnapshotStatus(REJECTED);
    }
  }

  return {
    hasMembershipAtSnapshot,
    memberUnitsAtSnapshot,
    memberUnitsAtSnapshotError,
    memberUnitsAtSnapshotStatus,
  };
}
