import {ContractsStateEntry} from '../../../store/contracts/types';
import {normalizeString} from '../../../util/helpers';
import {StoreState} from '../../../store/types';

/**
 * getContractByAddress
 *
 * Gets a Contract from the Redux contracts state slice by its `contractAddress`, or throws an Error.
 * A use case for this would be when using ERC712 signing data `actionId` to get
 * the appropriate Contract for submitting on-chain transactions.
 *
 * @param {string} address
 * @param {StoreState['contracts']} contracts
 */
export function getContractByAddress(
  address: string,
  contracts: StoreState['contracts']
): ContractsStateEntry<any> {
  try {
    const contract = Object.values(contracts).find(
      (c) =>
        c?.contractAddress &&
        normalizeString(c.contractAddress) === normalizeString(address)
    );

    if (!contract) {
      throw new Error(`Contract was not found in the store.`);
    }

    return contract;
  } catch (error) {
    throw error;
  }
}
