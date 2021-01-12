import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

/**
 * WEB3 TYPES
 */

// CONTRACTS

export type SmartContractItem = {
  instance: Web3Contract;
  abi: AbiItem[];
  contractAddress: string;
};

// PROPOSALS

/**
 * For the proposal `payload` key.
 * Required by both Moloch and Snapshot proposals
 */
export type CoreProposalPayload = {
  name: string;
  body: string;
  choices: CoreProposalVoteChoices;
};

export type SponsorProposalPayload = {
  /**
   * Date timestamp in seconds
   */
  start: number;
  /**
   * Date timestamp in seconds
   */
  end: number;
  /**
   * ETH block number coerced to `string`.
   */
  snapshot: string;
  type: CoreProposalType.proposal;
};

// Required by both Moloch and Snapshot proposals
export type CoreProposalData = {
  payload: CoreProposalPayload;
  /**
   * The ERC712 signature `string` returned from a signing function.
   */
  sig: string;
  /**
   * Space is a unique key (typically a contract address)
   * used by Moloch and Snapshot for building core proposal data.
   *
   * It is also used inside a Snapshot Hub for matching a `space`
   * with its own proposals and votes.
   */
  space: string;
  /**
   * Date timestamp in seconds
   */
  timestamp: number;
  type: CoreProposalType;
};

// Ordered vote choices. Do not change the indexes!
export type CoreProposalVoteChoices = [VoteChoices.yes, VoteChoices.no];

/**
 * WEB3 ENUMS
 */

// @todo Add 'transfer' and 'tribute' when ready
export enum ContractAdapterNames {
  configuration = 'configuration',
  financing = 'financing',
  guildkick = 'guildkick',
  managing = 'managing',
  onboarding = 'onboarding',
  ragequit = 'ragequit',
  voting = 'voting',
}

// @todo Add more as the need arises.
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

export enum CoreProposalType {
  draft = 'draft',
  proposal = 'proposal',
  result = 'result',
  vote = 'vote',
}

export enum VoteChoices {
  no = 'no',
  yes = 'yes',
}

export enum Web3State {
  Connected = 'Wallet connected',
  Error = 'Error connecting to wallet',
  NoWallet = 'No wallet found',
  Locked = 'Wallet disconnected',
}

export enum Web3TxStatus {
  STANDBY = 'STANDBY',
  AWAITING_CONFIRM = 'AWAITING_CONFIRM',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}
