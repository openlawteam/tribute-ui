import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import BigNumber from 'bignumber.js';

import {AsyncStatus} from '../util/types';
import {StoreState} from '../store/types';
import {UNITS_ADDRESS} from '../config';

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

export function useMemberUnitsAtSnapshot(
  memberAddress: string | undefined,
  snapshot: number | undefined
): UseMemberUnitsAtSnapshotReturn {
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
   * Effects
   */

  useEffect(() => {
    // These parameters may be arriving async and not ready, yet.
    if (!memberAddress || !snapshot || !bankExtensionMethods) return;

    handleGetPriorUnitsAmount({
      bankExtensionMethods,
      memberAddress,
      snapshot,
    });
  }, [bankExtensionMethods, memberAddress, snapshot]);

  /**
   * Functions
   */

  async function handleGetPriorUnitsAmount({
    bankExtensionMethods,
    memberAddress,
    snapshot,
  }: {
    memberAddress: string;
    snapshot: number;
    bankExtensionMethods: any;
  }): Promise<void> {
    try {
      // Reset any error
      setMemberUnitsAtSnapshotError(undefined);
      setMemberUnitsAtSnapshotStatus(PENDING);

      const memberUnitsAtSnapshot: string = await bankExtensionMethods
        .getPriorAmount(memberAddress, UNITS_ADDRESS, snapshot)
        .call();

      setMemberUnitsAtSnapshot(memberUnitsAtSnapshot);

      setHasMembershipAtSnapshot(
        new BigNumber(memberUnitsAtSnapshot).isGreaterThan(new BigNumber(0))
      );

      setMemberUnitsAtSnapshotStatus(FULFILLED);
    } catch (error) {
      setHasMembershipAtSnapshot(false);
      setMemberUnitsAtSnapshot(undefined);
      setMemberUnitsAtSnapshotError(error);
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
