import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem, toBN} from 'web3-utils';

import {
  SHARES_ADDRESS,
  LOOT_ADDRESS,
  LOCKED_LOOT_ADDRESS,
} from '../../../config';
import {AsyncStatus} from '../../../util/types';
import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';
import {multicall, MulticallTuple} from '../../../components/web3/helpers';
import {useWeb3Modal} from '../../../components/web3/hooks';
import {Member, MemberFlag} from '../types';

export default function useMembers() {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );
  const BankExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.BankExtensionContract
  );

  /**
   * Our hooks
   */

  const {web3Instance, account} = useWeb3Modal();

  /**
   * State
   */

  const [members, setMembers] = useState<Member[]>();
  const [membersStatus, setMembersStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Cached callbacks
   */

  const getMembersFromRegistryCached = useCallback(getMembersFromRegistry, [
    BankExtensionContract,
    DaoRegistryContract,
    account,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getMembersFromRegistryCached();
  }, [getMembersFromRegistryCached]);

  /**
   * Functions
   */

  async function getMembersFromRegistry() {
    if (
      !DaoRegistryContract ||
      !BankExtensionContract ||
      !account ||
      !web3Instance
    ) {
      setMembers(undefined);
      return;
    }

    setMembersStatus(AsyncStatus.PENDING);

    try {
      const {
        abi: daoRegistryABI,
        contractAddress: daoRegistryAddress,
        instance: {methods: daoRegistryMethods},
      } = DaoRegistryContract;

      const nbMembers = await daoRegistryMethods.getNbMembers().call();

      if (Number(nbMembers) < 1) {
        setMembers([]);
      } else {
        // Build calls to get list of member addresses
        const getMemberAddressABI = daoRegistryABI.find(
          (item) => item.name === 'getMemberAddress'
        );
        const getMemberAddressCalls = [...Array(Number(nbMembers)).keys()].map(
          (index): MulticallTuple => [
            daoRegistryAddress,
            getMemberAddressABI as AbiItem,
            [index.toString()],
          ]
        );
        const fetchedMemberAddresses: string[] = await multicall({
          calls: getMemberAddressCalls,
          web3Instance,
        });

        // Build calls to get list of member addresses by delegated key
        const memberAddressesByDelegatedKeyABI = daoRegistryABI.find(
          (item) => item.name === 'memberAddressesByDelegatedKey'
        );
        const memberAddressesByDelegatedKeyCalls = fetchedMemberAddresses.map(
          (address): MulticallTuple => [
            daoRegistryAddress,
            memberAddressesByDelegatedKeyABI as AbiItem,
            [address],
          ]
        );

        // Build calls to get member balances in SHARES, LOOT and LOCKED_LOOT
        const {
          abi: bankABI,
          contractAddress: bankAddress,
        } = BankExtensionContract;

        const balanceOfABI = bankABI.find((item) => item.name === 'balanceOf');
        const sharesBalanceOfCalls = fetchedMemberAddresses.map(
          (address): MulticallTuple => [
            bankAddress,
            balanceOfABI as AbiItem,
            [address, SHARES_ADDRESS],
          ]
        );
        const lootBalanceOfCalls = fetchedMemberAddresses.map(
          (address): MulticallTuple => [
            bankAddress,
            balanceOfABI as AbiItem,
            [address, LOOT_ADDRESS],
          ]
        );
        const lockedLootBalanceOfCalls = fetchedMemberAddresses.map(
          (address): MulticallTuple => [
            bankAddress,
            balanceOfABI as AbiItem,
            [address, LOCKED_LOOT_ADDRESS],
          ]
        );

        // Build calls to check if member is jailed
        const getMemberFlagABI = daoRegistryABI.find(
          (item) => item.name === 'getMemberFlag'
        );
        const getMemberFlagCalls = fetchedMemberAddresses.map(
          (address): MulticallTuple => [
            daoRegistryAddress,
            getMemberFlagABI as AbiItem,
            [address, MemberFlag.JAILED.toString()],
          ]
        );

        // Use multicall to get details for each member address
        const calls = [
          ...memberAddressesByDelegatedKeyCalls,
          ...sharesBalanceOfCalls,
          ...lootBalanceOfCalls,
          ...lockedLootBalanceOfCalls,
          ...getMemberFlagCalls,
        ];
        let results = await multicall({
          calls,
          web3Instance,
        });
        let chunkedResults = [];
        while (results.length) {
          chunkedResults.push(results.splice(0, fetchedMemberAddresses.length));
        }
        const [
          delegateKeys,
          sharesBalances,
          lootBalances,
          lockedLootBalances,
          isJailedChecks,
        ] = chunkedResults;
        const membersWithDetails = fetchedMemberAddresses.map(
          (address, index) => ({
            address,
            delegateKey: delegateKeys[index],
            isDelegated:
              normalizeString(address) !== normalizeString(delegateKeys[index]),
            shares: sharesBalances[index],
            loot: lootBalances[index],
            lockedLoot: lockedLootBalances[index],
            isJailed: isJailedChecks[index],
          })
        );

        // Filter out any member addresses that don't have a positive balance in either SHARES, LOOT or LOCKED_LOOT
        const filteredMembersWithDetails = membersWithDetails.filter(
          (member) =>
            toBN(member.shares).gt(toBN(0)) ||
            toBN(member.loot).gt(toBN(0)) ||
            toBN(member.lockedLoot).gt(toBN(0))
        );

        setMembers(filteredMembersWithDetails);
      }
      setMembersStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      console.error(error);
      setMembers(undefined);
      setMembersStatus(AsyncStatus.REJECTED);
    }
  }

  return {members, membersStatus};
}
