/**
 * DaoConstants as defined in the solidity DaoConstants.sol contract
 * and the available adapters as detailed here:
 * https://github.com/openlawteam/molochv3-contracts
 */
export enum DaoAdapterConstants {
  BANK = 'bank',
  CONFIGURATION = 'configuration',
  COUPON_ONBOARDING = 'coupon-onboarding',
  DISTRIBUTE = 'distribute',
  EXECUTION = 'execution',
  FINANCING = 'financing',
  GUILDKICK = 'guildkick',
  MANAGING = 'managing',
  NONVOTING_ONBOARDING = 'nonvoting-onboarding',
  OFFCHAINVOTING = 'offchainvoting',
  ONBOARDING = 'onboarding',
  RAGEQUIT = 'ragequit',
  TRIBUTE = 'tribute',
  TRIBUTE_NFT = 'tribute-nft',
  VOTING = 'voting',
}

export enum DaoExtensionConstants {
  BANK = 'bank',
  NFT = 'nft',
}

/**
 * Voting adapter names as defined in the solidity voting adapter contracts
 * i.e. `string public constant ADAPTER_NAME = "VotingContract"`.
 *
 * @link https://github.com/openlawteam/molochv3-contracts/blob/master/contracts/adapters/voting
 */
export enum VotingAdapterName {
  OffchainVotingContract = 'OffchainVotingContract',
  VotingContract = 'VotingContract',
}
