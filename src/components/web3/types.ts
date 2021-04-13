/**
 * WEB3 TYPES
 */

// ...

/**
 * WEB3 ENUMS
 */

/**
 * Should match molochv3-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractAdapterNames {
  configuration = 'configuration',
  distribute = 'distribute',
  financing = 'financing',
  guildkick = 'guildkick',
  managing = 'managing',
  onboarding = 'onboarding',
  ragequit = 'ragequit',
  tribute = 'tribute',
  voting = 'voting',
  bank = 'bank',
  tribute_nft = 'tribute-nft',
}

/**
 * These are custom adapters that don't exist in
 * DaoContracts
 */
export enum OtherContractAdapterNames {
  coupon_onboarding = 'coupon-onboarding',
}

/**
 * Should match molochv3-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractExtensionNames {
  bank = 'bank',
  nft = 'nft',
}

/**
 * Should match molochv3-contracts constants
 *
 * @todo Add other extensions as needs arise
 */
export enum ContractDAOConfigKeys {
  offchainVotingGracePeriod = 'offchainvoting.gracePeriod',
  offchainVotingStakingAmount = 'offchainvoting.stakingAmount',
  offchainVotingVotingPeriod = 'offchainvoting.votingPeriod',
  onboardingChunkSize = 'onboarding.chunkSize',
  onboardingMaximumChunks = 'onboarding.maximumChunks',
  onboardingSharesPerChunk = 'onboarding.sharesPerChunk',
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
