import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

import {
  DaoAdapterConstants,
  DaoExtensionConstants,
  VotingAdapterName,
} from '../../components/adapters-extensions/enums';

export type ContractsStateEntry = {
  /**
   * Web3 `Contract` instance
   */
  instance: Web3Contract;
  /**
   * Contract JSON ABI
   */
  abi: AbiItem[];
  /**
   * (Optional) Adapter/extension name, used for the Adapter/Extension Management
   */
  adapterOrExtensionName?:
    | DaoAdapterConstants
    | DaoExtensionConstants
    | VotingAdapterName;
  /**
   * Address of the instantiated contract
   */
  contractAddress: string;
};

export type ContractsState = {
  BankAdapterContract: ContractsStateEntry | null;
  BankExtensionContract: ContractsStateEntry | null;
  ConfigurationContract: ContractsStateEntry | null;
  CouponOnboardingContract: ContractsStateEntry | null;
  DaoFactoryContract: ContractsStateEntry | null;
  DaoRegistryAdapterContract: ContractsStateEntry | null;
  DaoRegistryContract: ContractsStateEntry | null;
  DistributeContract: ContractsStateEntry | null;
  ERC20ExtensionContract: ContractsStateEntry | null;
  FinancingContract: ContractsStateEntry | null;
  GuildBankContract: ContractsStateEntry | null;
  ManagingContract: ContractsStateEntry | null;
  NFTAdapterContract: ContractsStateEntry | null;
  NFTExtensionContract: ContractsStateEntry | null;
  OnboardingContract: ContractsStateEntry | null;
  RagequitContract: ContractsStateEntry | null;
  TributeContract: ContractsStateEntry | null;
  TributeNFTContract: ContractsStateEntry | null;
  VotingContract: ContractsStateEntry | null;
};
