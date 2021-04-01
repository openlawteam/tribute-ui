import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

import {
  DaoAdapterConstants,
  DaoExtensionConstants,
  OtherAdapterConstants,
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
    | OtherAdapterConstants
    | VotingAdapterName;
  /**
   * Address of the instantiated contract
   */
  contractAddress: string;
};

export type ContractsState = {
  BankExtensionContract: ContractsStateEntry | null;
  ConfigurationContract: ContractsStateEntry | null;
  CouponOnboardingContract: ContractsStateEntry | null;
  DaoFactoryContract: ContractsStateEntry | null;
  DaoRegistryContract: ContractsStateEntry | null;
  DistributeContract: ContractsStateEntry | null;
  FinancingContract: ContractsStateEntry | null;
  GuildBankContract: ContractsStateEntry | null;
  ManagingContract: ContractsStateEntry | null;
  NFTExtensionContract: ContractsStateEntry | null;
  OnboardingContract: ContractsStateEntry | null;
  RagequitContract: ContractsStateEntry | null;
  TributeContract: ContractsStateEntry | null;
  TributeNFTContract: ContractsStateEntry | null;
  VotingContract: ContractsStateEntry | null;
  WithdrawContract: ContractsStateEntry | null;
};
