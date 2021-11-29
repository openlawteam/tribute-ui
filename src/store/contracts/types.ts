import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';

import {BankAdapterContract} from '../../../abi-types/BankAdapterContract';
import {BankExtension} from '../../../abi-types/BankExtension';
import {ConfigurationContract} from '../../../abi-types/ConfigurationContract';
import {CouponOnboardingContract} from '../../../abi-types/CouponOnboardingContract';
import {DaoFactory} from '../../../abi-types/DaoFactory';
import {DaoRegistry} from '../../../abi-types/DaoRegistry';
import {DaoRegistryAdapterContract} from '../../../abi-types/DaoRegistryAdapterContract';
import {DistributeContract} from '../../../abi-types/DistributeContract';
import {ERC20Extension} from '../../../abi-types/ERC20Extension';
import {FinancingContract} from '../../../abi-types/FinancingContract';
import {GuildKickContract} from '../../../abi-types/GuildKickContract';
import {ManagingContract} from '../../../abi-types/ManagingContract';
import {NFTExtension} from '../../../abi-types/NFTExtension';
import {OnboardingContract} from '../../../abi-types/OnboardingContract';
import {RagequitContract} from '../../../abi-types/RagequitContract';
import {TributeContract} from '../../../abi-types/TributeContract';
import {TributeNFTContract} from '../../../abi-types/TributeNFTContract';

import {OffchainVotingContract} from '../../../abi-types/OffchainVotingContract';
import {VotingContract} from '../../../abi-types/VotingContract';

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
