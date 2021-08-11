import {AbiItem} from 'web3-utils/types';

import {VotingAdapterName} from '../../adapters-extensions/enums';

/**
 * getVotingAdapterABI
 *
 * Gets the ABI for a voting adapter by the adapter's adapter name.
 *
 * @param {VotingAdapterName} votingAdapterName
 * @returns {Promise<AbiItem[]>}
 */
export async function getVotingAdapterABI(
  votingAdapterName: VotingAdapterName
): Promise<AbiItem[]> {
  try {
    switch (votingAdapterName) {
      // Off-chain optimistic rollup
      case VotingAdapterName.OffchainVotingContract:
        const {default: lazyOffchainVotingABI} = await import(
          '../../../abis/OffchainVotingContract.json'
        );

        return lazyOffchainVotingABI as AbiItem[];

      // On-chain voting
      case VotingAdapterName.VotingContract:
        const {default: lazyVotingABI} = await import(
          '../../../abis/VotingContract.json'
        );

        return lazyVotingABI as AbiItem[];

      default:
        throw new Error(
          `No voting adapter name was found for "${votingAdapterName}".`
        );
    }
  } catch (error) {
    throw error;
  }
}
