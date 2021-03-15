import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {AbiItem} from 'web3-utils';

import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {StoreState} from '../../../store/types';
import {multicall, MulticallTuple} from '../../../components/web3/helpers';
import {useWeb3Modal} from '../../../components/web3/hooks';
import {Member} from '../types';

export default function useMembers() {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
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
    if (!DaoRegistryContract || !account || !web3Instance) {
      setMembers(undefined);
      return;
    }

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
        // filter out 0x0 and DaoFactory address
        const filteredMemberAddresses = fetchedMemberAddresses.filter(
          (address) => address.toLowerCase() !== BURN_ADDRESS
        );
        const members = filteredMemberAddresses.map((address) => ({address}));

        setMembers(members);
      }
    } catch (error) {
      console.error(error);
      setMembers(undefined);
    }
  }

  return {members};
}
