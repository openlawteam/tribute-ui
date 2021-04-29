import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem, toBN} from 'web3-utils';
import {useLazyQuery} from '@apollo/react-hooks';
import Web3 from 'web3';

import {UNITS_ADDRESS, GQL_QUERY_POLLING_INTERVAL} from '../../../config';
import {AsyncStatus} from '../../../util/types';
import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';
import {SubgraphNetworkStatus} from '../../../store/subgraphNetworkStatus/types';

import {multicall, MulticallTuple} from '../../../components/web3/helpers';
import {useWeb3Modal} from '../../../components/web3/hooks';
import {Member} from '../types';
import {GET_MEMBERS} from '../../../gql';

type UseMembersReturn = {
  members: Member[];
  membersStatus: AsyncStatus;
  membersError: Error | undefined;
};

/**
 * useMembers
 *
 * @returns `UseMembersReturn` An object with the members, and the current async status.
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

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * GQL Query
   */

  const [
    getMembersFromSubgraphResult,
    {called, loading, data, error, stopPolling},
  ] = useLazyQuery(GET_MEMBERS, {
    pollInterval: GQL_QUERY_POLLING_INTERVAL,
    variables: {
      daoAddress: DaoRegistryContract?.contractAddress.toLowerCase(),
    },
  });

  /**
   * State
   */

  const [members, setMembers] = useState<Member[]>([]);
  const [membersStatus, setMembersStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );
  const [membersError, setMembersError] = useState<Error>();

  /**
   * Cached callbacks
   */

  const getMembersFromRegistryCached = useCallback(getMembersFromRegistry, [
    BankExtensionContract,
    DaoRegistryContract,
    web3Instance,
  ]);
  const getMembersFromSubgraphCached = useCallback(getMembersFromSubgraph, [
    data,
    error,
    getMembersFromRegistryCached,
    loading,
    stopPolling,
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
      if (!loading && DaoRegistryContract?.contractAddress) {
        getMembersFromSubgraphCached();
      }
    } else {
      // If there is a subgraph network error fallback to fetching members info
      // directly from smart contracts
      stopPolling && stopPolling();
      getMembersFromRegistryCached();
    }
  }, [
    DaoRegistryContract?.contractAddress,
    getMembersFromRegistryCached,
    getMembersFromSubgraphCached,
    loading,
    stopPolling,
    subgraphNetworkStatus,
  ]);

  /**
   * Functions
   */

  function getMembersFromSubgraph() {
    try {
      setMembersStatus(AsyncStatus.PENDING);

      if (!loading && data) {
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
              address: Web3.utils.toChecksumAddress(member.address),
              delegateKey: Web3.utils.toChecksumAddress(member.delegateKey),
            };
          }
        );

        setMembersStatus(AsyncStatus.FULFILLED);
        setMembers(filteredMembersWithDetails);
      } else {
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      // If there is a subgraph query error fallback to fetching members info
      // directly from smart contracts
      console.log(`subgraph query error: ${error.message}`);
      stopPolling && stopPolling();
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

        // Build calls to get list of member addresses by delegated key
        const memberAddressesByDelegatedKeyABI = daoRegistryABI.find(
          (item) => item.name === 'memberAddressesByDelegatedKey'
        );
        const memberAddressesByDelegatedKeyCalls = memberAddresses.map(
          (address): MulticallTuple => [
            daoRegistryAddress,
            memberAddressesByDelegatedKeyABI as AbiItem,
            [address],
          ]
        );
        const memberAddressesByDelegatedKey: string[] = await multicall({
          calls: memberAddressesByDelegatedKeyCalls,
          web3Instance,
        });

        // Build calls to get member balances in UNITS
        const {
          abi: bankABI,
          contractAddress: bankAddress,
        } = BankExtensionContract;

        const balanceOfABI = bankABI.find((item) => item.name === 'balanceOf');
        const unitsBalanceOfCalls = memberAddressesByDelegatedKey.map(
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
          delegateKey: memberAddressesByDelegatedKey[index],
          isDelegated:
            normalizeString(address) !==
            normalizeString(memberAddressesByDelegatedKey[index]),
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
      }

      setMembersStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setMembersStatus(AsyncStatus.REJECTED);
      setMembers([]);
      setMembersError(error);
    }
  }

  return {members, membersError, membersStatus};
}
