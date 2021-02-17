import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';
import {Dispatch} from 'redux';

import {DaoConstants} from '../../components/adapters/config';
import {
  ContractAdapterNames,
  ContractExtensionNames,
} from '../../components/web3/types';
import {
  DEFAULT_CHAIN,
  DAO_FACTORY_CONTRACT_ADDRESS,
  DAO_REGISTRY_CONTRACT_ADDRESS,
  // BANK_CONTRACT_ADDRESS, // @todo
  CONFIGURATION_CONTRACT_ADDRESS,
  FINANCING_CONTRACT_ADDRESS,
  GUILDKICK_CONTRACT_ADDRESS,
  // NONVOTING_ONBOARDING_CONTRACT_ADDRESS, // @todo
  MANAGING_CONTRACT_ADDRESS,
  // ONBOARDING_CONTRACT_ADDRESS, // @todo revise the current impl
  RAGEQUIT_CONTRACT_ADDRESS,
  // TRIBUTE_CONTRACT_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
  // WITHDRAW_CONTRACT_ADDRESS // @todo
} from '../../config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {ContractsStateEntry, StoreState} from '../types';
import {getExtensionAddress} from '../../components/web3/helpers/getExtensionAddress';

type ContractAction =
  | typeof CONTRACT_DAO_FACTORY
  | typeof CONTRACT_DAO_REGISTRY
  | typeof CONTRACT_CONFIGURATION
  | typeof CONTRACT_FINANCING
  | typeof CONTRACT_GUILDKICK
  | typeof CONTRACT_OFFCHAIN_VOTING
  | typeof CONTRACT_NONVOTING_ONBOARDING
  | typeof CONTRACT_MANAGING
  | typeof CONTRACT_RAGEQUIT
  | typeof CONTRACT_VOTING
  | typeof CONTRACT_VOTING_OP_ROLLUP
  | typeof CONTRACT_ONBOARDING
  | typeof CONTRACT_BANK_EXTENSION
  | typeof CONTRACT_WITHDRAW
  | typeof CONTRACT_TRIBUTE;

export const CONTRACT_DAO_FACTORY = 'CONTRACT_DAO_FACTORY';
export const CONTRACT_DAO_REGISTRY = 'CONTRACT_DAO_REGISTRY';
export const CONTRACT_CONFIGURATION = 'CONTRACT_CONFIGURATION';
export const CONTRACT_FINANCING = 'CONTRACT_FINANCING';
export const CONTRACT_GUILDKICK = 'CONTRACT_GUILDKICK';
export const CONTRACT_OFFCHAIN_VOTING = 'CONTRACT_OFFCHAIN_VOTING';
export const CONTRACT_NONVOTING_ONBOARDING = 'CONTRACT_NONVOTING_ONBOARDING';
export const CONTRACT_MANAGING = 'CONTRACT_MANAGING';
export const CONTRACT_RAGEQUIT = 'CONTRACT_RAGEQUIT';
export const CONTRACT_VOTING = 'CONTRACT_VOTING';
export const CONTRACT_VOTING_OP_ROLLUP = 'CONTRACT_VOTING_OP_ROLLUP';
export const CONTRACT_ONBOARDING = 'CONTRACT_ONBOARDING';
export const CONTRACT_BANK_EXTENSION = 'CONTRACT_BANK_EXTENSION';
export const CONTRACT_WITHDRAW = 'CONTRACT_WITHDRAW';
export const CONTRACT_TRIBUTE = 'CONTRACT_TRIBUTE';

export function initContractDaoFactory(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyDaoFactoryABI} = await import(
          '../../truffle-contracts/DaoFactory.json'
        );
        const daoFactoryContract: AbiItem[] = lazyDaoFactoryABI as any;
        const contractAddress = DAO_FACTORY_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          daoFactoryContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_DAO_FACTORY,
            abi: daoFactoryContract,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

export function initContractDaoRegistry(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyDaoRegistryABI} = await import(
          '../../truffle-contracts/DaoRegistry.json'
        );

        const daoRegistryContract: AbiItem[] = lazyDaoRegistryABI as any;
        const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS[DEFAULT_CHAIN];

        if (!contractAddress) {
          throw new Error('No DAO Registry contract address was found.');
        }

        const instance = new web3Instance.eth.Contract(
          daoRegistryContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_DAO_REGISTRY,
            abi: daoRegistryContract,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

export function initContractVotingOpRollup(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyOffchainVotingABI} = await import(
          '../../truffle-contracts/OffchainVotingContract.json'
        );
        const offchainVotingContract: AbiItem[] = lazyOffchainVotingABI as any;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.voting,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          offchainVotingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_VOTING_OP_ROLLUP,
            abi: offchainVotingContract,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

export function initContractOnboarding(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyOnboardingABI} = await import(
          '../../truffle-contracts/OnboardingContract.json'
        );
        const onboardingContract: AbiItem[] = lazyOnboardingABI as any;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.onboarding,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          onboardingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_ONBOARDING,
            abi: onboardingContract,
            adapterName: DaoConstants.ONBOARDING,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// CONTRACT_CONFIGURATION
export function initContractConfiguration(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyConfigurationABI} = await import(
          '../../truffle-contracts/ConfigurationContract.json'
        );
        const configurationContract: AbiItem[] = lazyConfigurationABI as any;
        const contractAddress = CONFIGURATION_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          configurationContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_CONFIGURATION,
            abi: configurationContract,
            adapterName: DaoConstants.CONFIGURATION,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// FINANCING_CONTRACT_ADDRESS
export function initContractFinancing(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyFinancingABI} = await import(
          '../../truffle-contracts/FinancingContract.json'
        );
        const financingContract: AbiItem[] = lazyFinancingABI as any;
        const contractAddress = FINANCING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          financingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_FINANCING,
            abi: financingContract,
            adapterName: DaoConstants.FINANCING,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// GUILDKICK_CONTRACT_ADDRESS
export function initContractGuildKick(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyGuildKickABI} = await import(
          '../../truffle-contracts/GuildKickContract.json'
        );
        const guildKickContract: AbiItem[] = lazyGuildKickABI as any;
        const contractAddress = GUILDKICK_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          guildKickContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_GUILDKICK,
            abi: guildKickContract,
            adapterName: DaoConstants.GUILDKICK,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// MANAGING_CONTRACT_ADDRESS
export function initContractManaging(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyManagingABI} = await import(
          '../../truffle-contracts/ManagingContract.json'
        );
        const managingContract: AbiItem[] = lazyManagingABI as any;
        const contractAddress = MANAGING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          managingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_MANAGING,
            abi: managingContract,
            adapterName: DaoConstants.MANAGING,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// RAGEQUIT_CONTRACT_ADDRESS
export function initContractRagequit(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyRagequitABI} = await import(
          '../../truffle-contracts/RagequitContract.json'
        );
        const ragequitContract: AbiItem[] = lazyRagequitABI as any;
        const contractAddress = RAGEQUIT_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          ragequitContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_RAGEQUIT,
            abi: ragequitContract,
            adapterName: DaoConstants.RAGEQUIT,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

// VOTING_CONTRACT_ADDRESS
export function initContractVoting(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyVotingABI} = await import(
          '../../truffle-contracts/VotingContract.json'
        );
        const votingContract: AbiItem[] = lazyVotingABI as any;
        const contractAddress = VOTING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          votingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_VOTING,
            abi: votingContract,
            adapterName: DaoConstants.VOTING,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

/**
 * @note
 *   Once subgraph is implemented we may not need this.
 *   Currently it is used for getting voting weight before
 *   submitting the off-chain result on-chain.
 */
export function initContractBankExtension(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyBankExtensionABI} = await import(
          '../../truffle-contracts/BankExtension.json'
        );
        const bankExtensionContract: AbiItem[] = lazyBankExtensionABI as any;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getExtensionAddress(
          ContractExtensionNames.bank,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          bankExtensionContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_BANK_EXTENSION,
            abi: bankExtensionContract,
            adapterName: DaoConstants.BANK,
            contractAddress,
            instance,
          })
        );
      }
    } catch (error) {
      throw error;
    }
  };
}

function createContractAction({
  type,
  ...payload
}: {
  type: ContractAction;
} & ContractsStateEntry) {
  return {
    type,
    ...payload,
  };
}
