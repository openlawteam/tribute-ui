/**
 * TYPES
 */

// @todo Add more properties as needed for Member Profile features
export type Member = {
  address: string;
  delegateKey: string;
  isDelegated: boolean;
  shares: string;
  loot: string;
  lockedLoot: string;
  isJailed: boolean;
};

/**
 * ENUMS
 */

/**
 * Mapping of DaoRegistry member flags.
 * This should match the enum (including order) in the `DaoRegistry`. If it does not match,
 * the results of checking the member's state via flag will be wrong.
 *
 * @see `MemberFlag` `DaoRegistry.sol`
 * @see `getMemberFlag` `DaoRegistry.sol`
 */
export enum MemberFlag {
  EXISTS,
  JAILED,
}
