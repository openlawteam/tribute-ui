import {ContractAdapterNames} from '../types';
import {ContractsStateEntry} from '../../../store/contracts/types';
import {StoreState} from '../../../store/types';

function getContractAddressOrThrow(
  contract: ContractsStateEntry<any> | null
): string {
  try {
    const address = contract?.contractAddress;

    if (!address) {
      throw new Error(`Contract address was not found in the store.`);
    }

    return address;
  } catch (error) {
    throw error;
  }
}

/**
 * getAdapterAddressFromContracts
 *
 * Gets an adapter's address by its name (`type ContractAdapterNames`) from the Redux contracts state slice.
 *
 * @param {string} name
 * @param {StoreState['contracts']} contracts
 */
export function getAdapterAddressFromContracts(
  name: ContractAdapterNames,
  contracts: StoreState['contracts']
): string {
  try {
    switch (name) {
      case ContractAdapterNames.configuration:
        return '';
      case ContractAdapterNames.distribute:
        return getContractAddressOrThrow(contracts.DistributeContract);
      case ContractAdapterNames.financing:
        return '';
      case ContractAdapterNames.guildkick:
        return '';
      case ContractAdapterNames.kyc_onboarding:
        return getContractAddressOrThrow(contracts.KycOnboardingContract);
      case ContractAdapterNames.managing:
        return getContractAddressOrThrow(contracts.ManagingContract);
      case ContractAdapterNames.onboarding:
        return getContractAddressOrThrow(contracts.OnboardingContract);
      case ContractAdapterNames.ragequit:
        return '';
      case ContractAdapterNames.tribute:
        return getContractAddressOrThrow(contracts.TributeContract);
      case ContractAdapterNames.tribute_nft:
        return getContractAddressOrThrow(contracts.TributeNFTContract);
      case ContractAdapterNames.voting:
        return getContractAddressOrThrow(contracts.VotingContract);
      default:
        throw new Error(`Contract address was not found in the store.`);
    }
  } catch (error) {
    throw error;
  }
}
