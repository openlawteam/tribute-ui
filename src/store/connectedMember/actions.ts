import {Dispatch} from 'redux';

import {ConnectedMemberState, ContractsStateEntry} from '../types';

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
export function getConnectedMember(
  account: string,
  daoRegistryContract: ContractsStateEntry
) {
  return async function (dispatch: Dispatch<any>) {
    const daoRegistryInstance = daoRegistryContract.instance;

    if (!daoRegistryInstance || !account) {
      dispatch(clearConnectedMember());

      return;
    }

    try {
      const memberAddressByDelegateKey: string = await daoRegistryInstance.methods
        .memberAddressesByDelegatedKey(account)
        .call({from: account});
      const isActiveMember: boolean = await daoRegistryInstance.methods
        .isActiveMember(memberAddressByDelegateKey)
        .call({from: account});
      const currentDelegateKey: string = await daoRegistryInstance.methods
        .getCurrentDelegateKey(memberAddressByDelegateKey)
        .call({from: account});

      const isActiveMemberChecks: boolean =
        isActiveMember &&
        !memberAddressByDelegateKey.startsWith('0x0000000000');

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
