import {AbiItem, toBN, toChecksumAddress} from 'web3-utils';
import {useCallback, useEffect, useState} from 'react';
import {useLazyQuery} from '@apollo/react-hooks';
import {useSelector} from 'react-redux';

import {AsyncStatus} from '../../../util/types';
import {GET_MEMBERS} from '../../../gql';
import {Member} from '../types';
import {multicall, MulticallTuple} from '../../../components/web3/helpers';
import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';
import {SubgraphNetworkStatus} from '../../../store/subgraphNetworkStatus/types';
import {UNITS_ADDRESS} from '../../../config';
import {useENSName, useWeb3Modal} from '../../../components/web3/hooks';

type UseMembersReturn = {
  members: Member[];
  membersError: Error | undefined;
  membersStatus: AsyncStatus;
};

/**
 * useMembers
 *
 * Gets DAO members from subgraph with direct onchain fallback.
 *
 * @returns {UseMembersReturn} An object with the members and the current async status.
 */
export default function useMembers(): UseMembersReturn {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract
  );

  const BankExtensionContract = useSelector(
    (state: StoreState) => state.contracts.BankExtensionContract
  );

  const subgraphNetworkStatus = useSelector(
    (state: StoreState) => state.subgraphNetworkStatus.status
  );

  const connectedMember = useSelector(
    (state: StoreState) => state.connectedMember
  );

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  const [ensReverseResolvedAddresses, setAddressesToENSReverseResolve] =
    useENSName(web3Instance);

  /**
   * GQL Query
   */

  const [getMembersFromSubgraphResult, {called, loading, data, error}] =
    useLazyQuery(GET_MEMBERS, {
      variables: {
        daoAddress: DaoRegistryContract?.contractAddress.toLowerCase(),
      },
    });

  /**
   * State
   */

  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState<Error>();

  const [membersStatus, setMembersStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Cached callbacks
   */

  const getMembersFromRegistryCached = useCallback(getMembersFromRegistry, [
    BankExtensionContract,
    DaoRegistryContract,
    setAddressesToENSReverseResolve,
    web3Instance,
  ]);

  const getMembersFromSubgraphCached = useCallback(getMembersFromSubgraph, [
    data,
    error,
    getMembersFromRegistryCached,
    setAddressesToENSReverseResolve,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    if (!called) {
      getMembersFromSubgraphResult();
    }
  }, [called, getMembersFromSubgraphResult]);

  useEffect(() => {
    if (subgraphNetworkStatus === SubgraphNetworkStatus.OK) {
      if (called && !loading && DaoRegistryContract?.contractAddress) {
        getMembersFromSubgraphCached();
      }
    } else {
      // If there is a subgraph network error fallback to fetching members info
      // directly from smart contracts
      getMembersFromRegistryCached();
    }
  }, [
    DaoRegistryContract?.contractAddress,
    called,
    getMembersFromRegistryCached,
    getMembersFromSubgraphCached,
    loading,
    subgraphNetworkStatus,
  ]);

  useEffect(() => {
    connectedMember && getMembersFromRegistryCached();
  }, [connectedMember, getMembersFromRegistryCached]);

  /**
   * Set `Member.addressENS`
   *
   * Will be the same as the `Member.address` if no ENS reverse resolution found.
   */
  useEffect(() => {
    if (membersStatus !== AsyncStatus.FULFILLED) return;

    setMembers((members) =>
      members.map(
        (m, i): Member => ({...m, addressENS: ensReverseResolvedAddresses[i]})
      )
    );
  }, [ensReverseResolvedAddresses, membersStatus]);

  /**
   * Functions
   */

  function getMembersFromSubgraph() {
    try {
      setMembersStatus(AsyncStatus.PENDING);

      if (data) {
        // extract members from gql data
        const {members} = data.tributeDaos[0] as Record<string, any>;

        // Filter out any member that has fully ragequit (no positive balance in
        // UNITS)
        const filteredMembers = members.filter(
          (member: Record<string, any>) => !member.didFullyRagequit
        );

        const filteredMembersWithDetails = filteredMembers.map(
          (member: Record<string, any>) => {
            // remove gql data that is no longer needed
            const {createdAt, didFullyRagequit, ...parsedMember} = member;

            return {
              ...parsedMember,
              // use formatted addresses
              address: toChecksumAddress(member.address),
              delegateKey: toChecksumAddress(member.delegateKey),
            };
          }
        );

        setMembersStatus(AsyncStatus.FULFILLED);
        setMembers(filteredMembersWithDetails);

        setAddressesToENSReverseResolve(
          filteredMembersWithDetails.map((m: Member) => m.address)
        );
      } else {
        if (error) {
          throw new Error(`subgraph query error: ${error.message}`);
        } else if (typeof data === 'undefined') {
          // Additional case to catch `{"errors":{"message":"No indexers found
          // for subgraph deployment"}}` which does not get returned as an error
          // by the graph query call.
          throw new Error('subgraph query error: data is undefined');
        }
      }
    } catch (error) {
      const {message} = error as Error;

      // If there is a subgraph query error fallback to fetching members info
      // directly from smart contracts
      console.log(message);

      getMembersFromRegistryCached();
    }
  }

  async function getMembersFromRegistry() {
    if (!DaoRegistryContract || !BankExtensionContract || !web3Instance) {
      return;
    }

    try {
      setMembersStatus(AsyncStatus.PENDING);

      const {
        abi: daoRegistryABI,
        contractAddress: daoRegistryAddress,
        instance: {methods: daoRegistryMethods},
      } = DaoRegistryContract;

      const nbMembers = await daoRegistryMethods.getNbMembers().call();

      if (Number(nbMembers) > 0) {
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

        const memberAddresses: string[] = await multicall({
          calls: getMemberAddressCalls,
          web3Instance,
        });

        // Build calls to get list of delegate addresses by member addresses
        const getCurrentDelegateKeyABI = daoRegistryABI.find(
          (item) => item.name === 'getCurrentDelegateKey'
        );

        const getCurrentDelegateKeyCalls = memberAddresses.map(
          (address): MulticallTuple => [
            daoRegistryAddress,
            getCurrentDelegateKeyABI as AbiItem,
            [address],
          ]
        );

        const delegateKeys: string[] = await multicall({
          calls: getCurrentDelegateKeyCalls,
          web3Instance,
        });

        // Build calls to get member balances in UNITS
        const {abi: bankABI, contractAddress: bankAddress} =
          BankExtensionContract;

        const balanceOfABI = bankABI.find((item) => item.name === 'balanceOf');
        const unitsBalanceOfCalls = memberAddresses.map(
          (address): MulticallTuple => [
            bankAddress,
            balanceOfABI as AbiItem,
            [address, UNITS_ADDRESS],
          ]
        );

        const unitsBalances: string[] = await multicall({
          calls: unitsBalanceOfCalls,
          web3Instance,
        });

        const membersWithDetails = memberAddresses.map((address, index) => ({
          address,
          delegateKey: delegateKeys[index],
          isDelegated:
            normalizeString(address) !== normalizeString(delegateKeys[index]),
          units: unitsBalances[index],
        }));

        // Filter out any member addresses that don't have a positive balance in
        // UNITS
        const filteredMembersWithDetails = membersWithDetails
          .filter((member) => toBN(member.units).gt(toBN(0)))
          // display in descending order of when the member joined (e.g., newest
          // member first)
          .reverse();

        setMembers(filteredMembersWithDetails);

        setAddressesToENSReverseResolve(
          filteredMembersWithDetails.map((m: Member) => m.address)
        );
      }

      setMembersStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      const e = error as Error;

      setMembersStatus(AsyncStatus.REJECTED);
      setMembers([]);
      setMembersError(e);
    }
  }

  return {members, membersError, membersStatus};
}
