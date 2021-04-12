import {Dispatch} from 'redux';

import {BURN_ADDRESS} from '../../util/constants';
import {ConnectedMemberState} from '../connectedMember/types';
import {normalizeString} from '../../util/helpers';
import {SHARES_ADDRESS} from '../../config';
import {StoreState} from '../types';

export const SET_CONNECTED_MEMBER = 'SET_CONNECTED_MEMBER';
export const CLEAR_CONNECTED_MEMBER = 'CLEAR_CONNECTED_MEMBER';

/**
 * getConnectedMember
 *
 * Gets information about a connected address from the DAO's `members`.
 * If the user is not a member, the defaults for a non-existent member of the DAO are returned (e.g. "0x000000...")
 * and `isActiveMember` will be `false`.
 *
 * The reason state is set for both a member and a non-member
 * is to ensure we're not too restrictive in our Dapp logic and
 * letting the contract do its job.
 */
export function getConnectedMember(account: string) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    const daoRegistryMethods = getState().contracts.DaoRegistryContract
      ?.instance.methods;
    const bankExtensionMethods = getState().contracts.BankExtensionContract
      ?.instance.methods;

    if (!daoRegistryMethods || !bankExtensionMethods || !account) {
      dispatch(clearConnectedMember());

      return;
    }

    try {
      const memberAddressByDelegateKey: string = await daoRegistryMethods
        .memberAddressesByDelegatedKey(account)
        .call({from: account});

      const isActiveMember: boolean =
        Number(
          await bankExtensionMethods
            .balanceOf(memberAddressByDelegateKey, SHARES_ADDRESS)
            .call({from: account})
        ) > 0;

      const currentDelegateKey: string = await daoRegistryMethods
        .getCurrentDelegateKey(memberAddressByDelegateKey)
        .call({from: account});

      const isActiveMemberChecks: boolean =
        isActiveMember &&
        normalizeString(memberAddressByDelegateKey) !== BURN_ADDRESS;

      dispatch(
        setConnectedMember({
          delegateKey: currentDelegateKey,
          isActiveMember: isActiveMemberChecks,
          memberAddress: memberAddressByDelegateKey,
        })
      );
    } catch (error) {
      dispatch(clearConnectedMember());

      throw error;
    }
  };
}

export function setConnectedMember(payload: ConnectedMemberState) {
  return {type: SET_CONNECTED_MEMBER, ...payload};
}

export function clearConnectedMember() {
  return {type: CLEAR_CONNECTED_MEMBER};
}
