import {useState, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import usePreviousDistinct from 'react-use/lib/usePreviousDistinct';
import {AbiItem} from 'web3-utils';

import {AsyncStatus} from '../../../util/types';
import {StoreState} from '../../../store/types';
import {multicall, MulticallTuple} from '../../../components/web3/helpers';
import {useWeb3Modal} from '../../../components/web3/hooks';
import {truncateEthAddress} from '../../../util/helpers';

type UseCheckApplicantReturn = {
  checkApplicantError: Error | undefined;
  checkApplicantInvalidMsg: string | undefined;
  checkApplicantStatus: AsyncStatus;
  isApplicantValid: boolean | undefined;
};

/**
 * useCheckApplicant
 *
 * Checks if the provided applicant address is valid to become a potential new member.
 *
 * @export
 * @param {string} [address]
 * @returns {UseCheckApplicantReturn}
 */
export function useCheckApplicant(address?: string): UseCheckApplicantReturn {
  /**
   * Selectors
   */

  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract
  );

  /**
   * State
   */

  const [checkApplicantError, setCheckApplicantError] = useState<Error>();
  const [checkApplicantInvalidMsg, setCheckApplicantInvalidMsg] =
    useState<string>();
  const [checkApplicantStatus, setCheckApplicantStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );
  const [isApplicantValid, setIsApplicantValid] = useState<boolean>();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Their hooks
   */

  const prevAddress = usePreviousDistinct(address);

  /**
   * Cached callbacks
   */

  const checkApplicantValidityCached = useCallback(checkApplicantValidity, [
    DaoRegistryContract,
    address,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    // Reset state if no address is detected
    if (prevAddress && !address) {
      setCheckApplicantError(undefined);
      setCheckApplicantInvalidMsg(undefined);
      setIsApplicantValid(undefined);
      setCheckApplicantStatus(AsyncStatus.STANDBY);
    }

    if (address) {
      checkApplicantValidityCached();
    }
  }, [address, checkApplicantValidityCached, prevAddress]);

  /**
   * Functions
   */

  async function checkApplicantValidity() {
    if (!address || !DaoRegistryContract || !web3Instance) return;

    try {
      setCheckApplicantStatus(AsyncStatus.PENDING);

      const truncatedAddress = truncateEthAddress(address, 7);

      const {abi: daoRegistryABI, contractAddress: daoRegistryAddress} =
        DaoRegistryContract;

      // Build calls to DaoRegistry contract (which includes relevant DaoConstants functions)
      const getIsNotReservedAddressABI = daoRegistryABI.find(
        (item) => item.name === 'isNotReservedAddress'
      );
      const isNotReservedAddressCall: MulticallTuple = [
        daoRegistryAddress,
        getIsNotReservedAddressABI as AbiItem,
        [address],
      ];

      const getIsNotZeroAddressABI = daoRegistryABI.find(
        (item) => item.name === 'isNotZeroAddress'
      );
      const isNotZeroAddressCall: MulticallTuple = [
        daoRegistryAddress,
        getIsNotZeroAddressABI as AbiItem,
        [address],
      ];

      const getGetAddressIfDelegatedABI = daoRegistryABI.find(
        (item) => item.name === 'getAddressIfDelegated'
      );
      const getAddressIfDelegatedCall: MulticallTuple = [
        daoRegistryAddress,
        getGetAddressIfDelegatedABI as AbiItem,
        [address],
      ];

      const calls = [
        isNotReservedAddressCall,
        isNotZeroAddressCall,
        getAddressIfDelegatedCall,
      ];

      const [
        isNotReservedAddressResult,
        isNotZeroAddressResult,
        getAddressIfDelegatedResult,
      ]: [boolean, boolean, string] = await multicall({calls, web3Instance});

      if (!isNotReservedAddressResult) {
        // Applicant address cannot be a reserved address.
        setIsApplicantValid(false);
        setCheckApplicantInvalidMsg(
          `The applicant address ${truncatedAddress} is invalid because it is a DAO reserved address.`
        );
      } else if (!isNotZeroAddressResult) {
        // Applicant address cannot be 0x0 address.
        setIsApplicantValid(false);
        setCheckApplicantInvalidMsg(
          `The applicant address ${truncatedAddress} is invalid.`
        );
      } else if (
        address.toLowerCase() !== getAddressIfDelegatedResult.toLowerCase()
      ) {
        // Applicant address cannot already be in use as a delegate key.
        setIsApplicantValid(false);
        setCheckApplicantInvalidMsg(
          `The applicant address ${truncatedAddress} is already in use as a delegate key. The address must be removed as a delegate before it can become a member.`
        );
      } else {
        setIsApplicantValid(true);
        setCheckApplicantInvalidMsg(undefined);
      }

      setCheckApplicantStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      setIsApplicantValid(undefined);
      setCheckApplicantInvalidMsg(undefined);
      setCheckApplicantError(error);
      setCheckApplicantStatus(AsyncStatus.REJECTED);
    }
  }

  return {
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
  };
}
