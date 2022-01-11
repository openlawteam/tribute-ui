import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

import {BankAdapterContract} from '../../abis/types/BankAdapterContract';
import {BankExtension} from '../../abis/types/BankExtension';
import {ConfigurationContract} from '../../abis/types/ConfigurationContract';
import {CouponOnboardingContract} from '../../abis/types/CouponOnboardingContract';
import {DaoFactory} from '../../abis/types/DaoFactory';
import {DaoRegistry} from '../../abis/types/DaoRegistry';
import {DaoRegistryAdapterContract} from '../../abis/types/DaoRegistryAdapterContract';
import {DistributeContract} from '../../abis/types/DistributeContract';
import {ERC20Extension} from '../../abis/types/ERC20Extension';
import {FinancingContract} from '../../abis/types/FinancingContract';
import {GuildKickContract} from '../../abis/types/GuildKickContract';
import {KycOnboardingContract} from '../../abis/types/KycOnboardingContract';
import {ManagingContract} from '../../abis/types/ManagingContract';
import {NFTExtension} from '../../abis/types/NFTExtension';
import {OnboardingContract} from '../../abis/types/OnboardingContract';
import {RagequitContract} from '../../abis/types/RagequitContract';
import {TributeContract} from '../../abis/types/TributeContract';
import {TributeNFTContract} from '../../abis/types/TributeNFTContract';

import {OffchainVotingContract} from '../../abis/types/OffchainVotingContract';
import {VotingContract} from '../../abis/types/VotingContract';

import {
  DaoAdapterConstants,
  DaoExtensionConstants,
  VotingAdapterName,
} from '../../components/adapters-extensions/enums';

export type ContractsStateEntry<TContract = Web3Contract> = {
  /**
   * Web3 `Contract` instance
   */
  instance: TContract;
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
  BankAdapterContract: ContractsStateEntry<BankAdapterContract> | null;
  BankExtensionContract: ContractsStateEntry<BankExtension> | null;
  ConfigurationContract: ContractsStateEntry<ConfigurationContract> | null;
  CouponOnboardingContract: ContractsStateEntry<CouponOnboardingContract> | null;
  DaoFactoryContract: ContractsStateEntry<DaoFactory> | null;
  DaoRegistryAdapterContract: ContractsStateEntry<DaoRegistryAdapterContract> | null;
  DaoRegistryContract: ContractsStateEntry<DaoRegistry> | null;
  DistributeContract: ContractsStateEntry<DistributeContract> | null;
  ERC20ExtensionContract: ContractsStateEntry<ERC20Extension> | null;
  FinancingContract: ContractsStateEntry<FinancingContract> | null;
  GuildKickContract: ContractsStateEntry<GuildKickContract> | null;
  KycOnboardingContract: ContractsStateEntry<KycOnboardingContract> | null;
  ManagingContract: ContractsStateEntry<ManagingContract> | null;
  NFTExtensionContract: ContractsStateEntry<NFTExtension> | null;
  OnboardingContract: ContractsStateEntry<OnboardingContract> | null;
  RagequitContract: ContractsStateEntry<RagequitContract> | null;
  TributeContract: ContractsStateEntry<TributeContract> | null;
  TributeNFTContract: ContractsStateEntry<TributeNFTContract> | null;
  VotingContract: ContractsStateEntry<
    OffchainVotingContract | VotingContract
  > | null;
};
