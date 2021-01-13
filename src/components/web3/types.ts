import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

/**
 * WEB3 TYPES
 */

// -----------------------------
// CONTRACTS
// -----------------------------

export type SmartContractItem = {
  /**
   * Web3 `Contract` instance
   */
  instance: Web3Contract;
  /**
   * Contract JSON ABI
   */
  abi: AbiItem[];
  /**
   * Address of the instantiated contract
   */
  contractAddress: string;
};

// -----------------------------
// PROPOSALS
// -----------------------------

/**
 * JSON request data to stringify for `POST` to Snapshot Hub.
 */
export type SnapshotProposalRequestBody = {
  /**
   * The address of the submitting user.
   */
  address: string;
  /**
   * Stringified JSON message of `CoreProposalData`
   */
  msg: CoreProposalData;
  /**
   * Resulting hash of a Web3 wallet signature (e.g. ERC712; `eth.personal.sign`)
   */
  sig: string;
};

/**
 * For the proposal `payload` key.
 * Required by both Moloch and Snapshot proposals
 */
export type CoreProposalDataPayload = {
  /**
   * Descriptive text content to describe the Draft/Proposal.
   */
  body: string;
  /**
   * Voting choices
   */
  choices: CoreProposalVoteChoices;
  /**
   * Any other stringifiable information about the Draft/Proposal
   */
  metadata: Record<string, any>;
  /**
   * Name of a Draft/Proposal
   */
  name: string;
  /**
   * Date timestamp in seconds
   */
  start?: number;
  /**
   * Date timestamp in seconds
   */
  end?: number;
  /**
   * ETH block number coerced to `string`.
   */
  snapshot?: string;
};

// Required by both Moloch and Snapshot proposals
export type CoreProposalData = {
  /**
   * The core content of a Snapshot Draft/Proposal.
   */
  payload: CoreProposalDataPayload;
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
  /**
   * Unique string (typically a contract address) which is coupled to a `space`.
   */
  token: string;
  /**
   * Snapshot entity type
   */
  type: CoreProposalType;

  // ERC712 Signature SIGNING-SPECIFIC DATA. NOT STORED IN SNAPSHOT.

  /**
   * An adapter's contract address (i.e. for `Onboarding.sol`).
   * For signature ERC712 verification. Value is not stored.
   */
  actionId: string;
  /**
   * For signature ERC712 verification. Value is not stored.
   */
  chainId: number;
  /**
   * The main contract address (i.e. for `DaoRegistry.sol`).
   * For signature ERC712 verification. Value is not stored.
   */
  verifyingContract: string;
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
