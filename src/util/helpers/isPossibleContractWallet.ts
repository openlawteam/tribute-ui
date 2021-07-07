import {providers} from 'ethers';

import {normalizeString} from './normalizeString';

/**
 * isPossibleContractWallet
 *
 * When passing a connected ethereum address, if there is bytecode at the address,
 * there is a good chance that it's a contract wallet. This is not 100% accurate, but it's
 * good enough to make a guess and do something trivial in the UI.
 *
 * @param address
 * @param provider
 * @returns `boolean`
 */
export async function isPossibleContractWallet(
  /**
   * Ethereum wallet address to check
   */
  address: string,
  /**
   * Ethers provider
   *
   * E.g. `new JsonRpcProvider(...)`
   */
  provider: providers.Provider
): Promise<boolean> {
  try {
    const bytecode = await provider.getCode(normalizeString(address));

    // It's a bit easier to detect an EOA (typical public/private key crypto wallet)
    const addressIsExernallyOwnedAccount: boolean =
      !bytecode ||
      bytecode === '0x' ||
      bytecode === '0x0' ||
      bytecode === '0x00';

    return addressIsExernallyOwnedAccount === false;
  } catch (error) {
    throw error;
  }
}
