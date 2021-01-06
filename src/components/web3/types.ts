import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

export type SmartContractItem = {
  instance: Web3Contract;
  abi: AbiItem[];
  contractAddress: string;
};

export type SmartContracts = {
  DaoRegistryContract: SmartContractItem;
  FinancingContract: SmartContractItem;
  OffchainVotingContract: SmartContractItem;
  OnboardingContract: SmartContractItem;
};

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

export enum ContractAdapterNames {
  configuration = 'configuration',
  financing = 'financing',
  guildkick = 'guildkick',
  managing = 'managing',
  onboarding = 'onboarding',
  ragequit = 'ragequit',
  voting = 'voting',
}
