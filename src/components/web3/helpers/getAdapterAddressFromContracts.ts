import {SmartContractItem, ContractAdapterNames} from '../types';
import {StoreState} from '../../../store/types';

function getContractAddressOrThrow(contract: SmartContractItem | null): string {
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
 * @note This is mainly for Adapters which submit proposals other than voting, so we have not included voting.
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
      case ContractAdapterNames.financing:
        return '';
      case ContractAdapterNames.guildkick:
        return '';
      case ContractAdapterNames.managing:
        return '';
      case ContractAdapterNames.onboarding:
        return getContractAddressOrThrow(contracts.OnboardingContract);
      case ContractAdapterNames.ragequit:
        return '';
      default:
        throw new Error(`Contract address was not found in the store.`);
    }
  } catch (error) {
    throw error;
  }
}
