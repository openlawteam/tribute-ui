/**
 * Constants as defined in the solidity DaoHelper.sol contract and the available
 * adapters as detailed here: https://github.com/openlawteam/tribute-contracts
 */
export enum DaoAdapterConstants {
  BANK = 'bank',
  CONFIGURATION = 'configuration',
  COUPON_ONBOARDING = 'coupon-onboarding',
  DAO_REGISTRY = 'daoRegistry',
  DISTRIBUTE = 'distribute',
  EXECUTION = 'execution',
  FINANCING = 'financing',
  GUILDKICK = 'guildkick',
  KYC_ONBOARDING = 'kyc-onboarding',
  MANAGING = 'managing',
  NFT = 'nft',
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
  ERC20 = 'erc20-ext',
  NFT = 'nft',
}

/**
 * Voting adapter names as defined in the solidity voting adapter contracts
 * i.e. `string public constant ADAPTER_NAME = "VotingContract"`.
 *
 * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting
 */
export enum VotingAdapterName {
  OffchainVotingContract = 'OffchainVotingContract',
  VotingContract = 'VotingContract',
}
