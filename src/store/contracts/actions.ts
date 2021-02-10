import Web3 from 'web3';
import {Dispatch} from 'redux';

import {ContractAdapterNames} from '../../components/web3/types';
import {
  DEFAULT_CHAIN,
  DAO_REGISTRY_CONTRACT_ADDRESS,
  // BANK_CONTRACT_ADDRESS, // @todo
  CONFIGURATION_CONTRACT_ADDRESS,
  // EXECUTION_CONTRACT_ADDRESS, // @todo
  FINANCING_CONTRACT_ADDRESS,
  GUILDKICK_CONTRACT_ADDRESS,
  // NONVOTING_ONBOARDING_CONTRACT_ADDRESS, // @todo
  MANAGING_CONTRACT_ADDRESS,
  // ONBOARDING_CONTRACT_ADDRESS, // @todo revise the current impl
  RAGEQUIT_CONTRACT_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
  // WITHDRAW_CONTRACT_ADDRESS // @todo
} from '../../config';
import {DaoConstants} from '../../components/adapters/config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {StoreState} from '../types';

export const CONTRACT_DAO_REGISTRY = 'CONTRACT_DAO_REGISTRY';
export const CONTRACT_BANK = 'CONTRACT_BANK';
export const CONTRACT_CONFIGURATION = 'CONTRACT_CONFIGURATION';
export const CONTRACT_EXECUTION = 'CONTRACT_EXECUTION';
export const CONTRACT_FINANCING = 'CONTRACT_FINANCING';
export const CONTRACT_GUILDKICK = 'CONTRACT_GUILDKICK';
export const CONTRACT_OFFCHAIN_VOTING = 'CONTRACT_OFFCHAIN_VOTING';
export const CONTRACT_ONBOARDING = 'CONTRACT_ONBOARDING';
export const CONTRACT_NONVOTING_ONBOARDING = 'CONTRACT_NONVOTING_ONBOARDING';
export const CONTRACT_MANAGING = 'CONTRACT_MANAGING';
export const CONTRACT_RAGEQUIT = 'CONTRACT_RAGEQUIT';
export const CONTRACT_VOTING = 'CONTRACT_VOTING';

/**
 * @todo Add inits for Transfer and Tribute when ready
 */

export function initContractDaoRegistry(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const lazyDaoRegistryABI = await import(
          '../../truffle-contracts/DaoRegistry.json'
        );
        const daoRegistryContract: Record<string, any> = lazyDaoRegistryABI;
        const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          daoRegistryContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_DAO_REGISTRY,
          abi: daoRegistryContract.abi,
          contractAddress,
          instance,
        });
      }
    } catch (error) {
      throw error;
    }
  };
}

export function initContractOffchainVoting(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const lazyOffchainVotingABI = await import(
          '../../truffle-contracts/OffchainVotingContract.json'
        );
        const offchainVotingContract: Record<
          string,
          any
        > = lazyOffchainVotingABI;
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
          offchainVotingContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_OFFCHAIN_VOTING,
          abi: offchainVotingContract.abi,
          adapterName: DaoConstants.OFFCHAIN_VOTING,
          contractAddress,
          instance,
        });
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
        const lazyOnboardingABI = await import(
          '../../truffle-contracts/OnboardingContract.json'
        );
        const onboardingContract: Record<string, any> = lazyOnboardingABI;
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
          onboardingContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_ONBOARDING,
          abi: onboardingContract.abi,
          adapterName: DaoConstants.ONBOARDING,
          contractAddress,
          instance,
        });
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
        const lazyConfigurationABI = await import(
          '../../truffle-contracts/ConfigurationContract.json'
        );
        const configurationContract: Record<string, any> = lazyConfigurationABI;
        const contractAddress = CONFIGURATION_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          configurationContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_CONFIGURATION,
          abi: configurationContract.abi,
          adapterName: DaoConstants.CONFIGURATION,
          contractAddress,
          instance,
        });
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
        const lazyFinancingABI = await import(
          '../../truffle-contracts/FinancingContract.json'
        );
        const financingContract: Record<string, any> = lazyFinancingABI;
        const contractAddress = FINANCING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          financingContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_FINANCING,
          abi: financingContract.abi,
          adapterName: DaoConstants.FINANCING,
          contractAddress,
          instance,
        });
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
        const lazyGuildKickABI = await import(
          '../../truffle-contracts/GuildKickContract.json'
        );
        const guildKickContract: Record<string, any> = lazyGuildKickABI;
        const contractAddress = GUILDKICK_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          guildKickContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_GUILDKICK,
          abi: guildKickContract.abi,
          adapterName: DaoConstants.GUILDKICK,
          contractAddress,
          instance,
        });
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
        const lazyManagingABI = await import(
          '../../truffle-contracts/ManagingContract.json'
        );
        const managingContract: Record<string, any> = lazyManagingABI;
        const contractAddress = MANAGING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          managingContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_MANAGING,
          abi: managingContract.abi,
          adapterName: DaoConstants.MANAGING,
          contractAddress,
          instance,
        });
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
        const lazyRagequitABI = await import(
          '../../truffle-contracts/RagequitContract.json'
        );
        const ragequitContract: Record<string, any> = lazyRagequitABI;
        const contractAddress = RAGEQUIT_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          ragequitContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_RAGEQUIT,
          abi: ragequitContract.abi,
          adapterName: DaoConstants.RAGEQUIT,
          contractAddress,
          instance,
        });
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
        const lazyVotingABI = await import(
          '../../truffle-contracts/VotingContract.json'
        );
        const votingContract: Record<string, any> = lazyVotingABI;
        const contractAddress = VOTING_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          votingContract.abi,
          contractAddress
        );

        dispatch({
          type: CONTRACT_VOTING,
          abi: votingContract.abi,
          adapterName: DaoConstants.VOTING,
          contractAddress,
          instance,
        });
      }
    } catch (error) {
      throw error;
    }
  };
}
