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
  votingAdapterName: VotingAdapterName,
  useCurrentVotingAdapter: boolean = true
): Promise<AbiItem[]> {
  try {
    switch (votingAdapterName) {
      // Off-chain optimistic rollup
      case VotingAdapterName.OffchainVotingContract:
        // @todo This is part of a temporary solution to switch OffchainVoting
        // ABI based on the adapter address used by the proposal. If the
        // proposal's voting adapter address matches the DAO's current voting
        // adapter address then we use the corresponding ABI for it. Otherwise,
        // we use the old ABI for OffchainVotingContract v1.0.0. This should be
        // replaced by a dynamic solution to get the correct ABI based on the
        // voting adapter address.
        if (useCurrentVotingAdapter) {
          const {default: lazyOffchainVotingABI} = await import(
            '../../../abis/OffchainVotingContract.json'
          );

          return lazyOffchainVotingABI as AbiItem[];
        } else {
          const {default: lazyOffchainVotingABI} = await import(
            '../../../abis/v1_0_0/OffchainVotingContract.json'
          );

          return lazyOffchainVotingABI as AbiItem[];
        }

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
