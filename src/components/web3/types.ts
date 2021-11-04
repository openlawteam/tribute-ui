/**
 * WEB3 TYPES
 */

// ...

/**
 * WEB3 ENUMS
 */

/**
 * Mapping of DaoRegistry member flags. This should match the enum (including
 * order) in the `DaoRegistry`. If it does not match,
 * the results of checking the proposal's state via flag will be wrong.
 *
 * @see `MemberFlag` `DaoRegistry.sol`
 * @see `getFlag` `DaoHelper.sol`
 * @see `setFlag` `DaoHelper.sol`
 */
export enum MemberFlag {
  EXISTS,
}

/**
 * Should match tribute-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractAdapterNames {
  bank = 'bank',
  configuration = 'configuration',
  coupon_onboarding = 'coupon-onboarding',
  dao_registry = 'daoRegistry',
  distribute = 'distribute',
  financing = 'financing',
  guildkick = 'guildkick',
  managing = 'managing',
  nft = 'nft',
  onboarding = 'onboarding',
  ragequit = 'ragequit',
  tribute = 'tribute',
  tribute_nft = 'tribute-nft',
  voting = 'voting',
}

/**
 * Should match tribute-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractExtensionNames {
  bank = 'bank',
  erc20 = 'erc20-ext',
  nft = 'nft',
}

/**
 * Should match tribute-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractDAOConfigKeys {
  offchainVotingGracePeriod = 'offchainvoting.gracePeriod',
  offchainVotingStakingAmount = 'offchainvoting.stakingAmount',
  offchainVotingVotingPeriod = 'offchainvoting.votingPeriod',
  onboardingChunkSize = 'onboarding.chunkSize',
  onboardingMaximumChunks = 'onboarding.maximumChunks',
  onboardingUnitsPerChunk = 'onboarding.unitsPerChunk',
  onboardingTokenAddr = 'onboarding.tokenAddr',
  votingGracePeriod = 'voting.gracePeriod',
  votingStakingAmount = 'voting.stakingAmount',
  votingVotingPeriod = 'voting.votingPeriod',
}

export enum VoteChoices {
  Yes = 'Yes',
  No = 'No',
}

export enum Web3TxStatus {
  STANDBY = 'STANDBY',
  AWAITING_CONFIRM = 'AWAITING_CONFIRM',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}
