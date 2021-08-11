import {Dispatch} from 'redux';
import Web3 from 'web3';

import {BURN_ADDRESS} from '../../util/constants';
import {ConnectedMemberState} from '../connectedMember/types';
import {ContractsStateEntry} from '../contracts/types';
import {DaoRegistry} from '../../../abi-types/DaoRegistry';
import {hasFlag, multicall} from '../../components/web3/helpers';
import {MemberFlag} from '../../components/web3/types';
import {normalizeString} from '../../util/helpers';

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
export function getConnectedMember({
  account,
  daoRegistryContract,
  web3Instance,
}: {
  account: string;
  daoRegistryContract: ContractsStateEntry<DaoRegistry>;
  web3Instance: Web3;
}) {
  return async function (dispatch: Dispatch<any>) {
    const daoRegistryAddress = daoRegistryContract?.contractAddress;

    const getAddressIfDelegatedABI = daoRegistryContract?.abi.find(
      (ai) => ai.name === 'getAddressIfDelegated'
    );
    const membersABI = daoRegistryContract?.abi.find(
      (ai) => ai.name === 'members'
    );
    const isActiveMemberABI = daoRegistryContract?.abi.find(
      (ai) => ai.name === 'isActiveMember'
    );
    const getCurrentDelegateKeyABI = daoRegistryContract?.abi.find(
      (ai) => ai.name === 'getCurrentDelegateKey'
    );

    if (
      !account ||
      !daoRegistryAddress ||
      !getAddressIfDelegatedABI ||
      !getCurrentDelegateKeyABI ||
      !isActiveMemberABI ||
      !membersABI
    ) {
      dispatch(clearConnectedMember());

      return;
    }

    try {
      /**
       * @link https://github.com/openlawteam/tribute-contracts/blob/master/docs/core/DaoRegistry.md
       */

      const [
        addressIfDelegated,
        memberFlag,
        isActiveMember,
        currentDelegateKey,
      ] = await multicall({
        calls: [
          [daoRegistryAddress, getAddressIfDelegatedABI, [account]],
          [daoRegistryAddress, membersABI, [account]],
          [
            daoRegistryAddress,
            isActiveMemberABI,
            [daoRegistryAddress, account],
          ],
          [daoRegistryAddress, getCurrentDelegateKeyABI, [account]],
        ],
        web3Instance,
      });

      // A member can exist in the DAO, yet not be an active member (has units > 0)
      const doesMemberExist: boolean = hasFlag(MemberFlag.EXISTS, memberFlag);

      // Is this address known to the DAO?
      const delegateKey: string =
        isActiveMember || doesMemberExist ? currentDelegateKey : BURN_ADDRESS;

      // Is this address known to the DAO?
      const memberAddress: string =
        isActiveMember || doesMemberExist ? addressIfDelegated : BURN_ADDRESS;

      const isAddressDelegated: boolean =
        normalizeString(account) === normalizeString(memberAddress) &&
        normalizeString(account) !== normalizeString(delegateKey);

      dispatch(
        setConnectedMember({
          delegateKey,
          isAddressDelegated,
          isActiveMember,
          memberAddress,
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
