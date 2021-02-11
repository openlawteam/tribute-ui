import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';
import {Dispatch} from 'redux';

import {
  ContractAdapterNames,
  ContractExtensionNames,
} from '../../components/web3/types';
import {DEFAULT_CHAIN, DAO_REGISTRY_CONTRACT_ADDRESS} from '../../config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {ContractsStateEntry, StoreState} from '../types';
import {getExtensionAddress} from '../../components/web3/helpers/getExtensionAddress';

type ContractAction =
  | typeof CONTRACT_DAO_REGISTRY
  | typeof CONTRACT_VOTING_OP_ROLLUP
  | typeof CONTRACT_ONBOARDING
  | typeof CONTRACT_BANK_EXTENSION
  | typeof CONTRACT_TRIBUTE;

export const CONTRACT_DAO_REGISTRY = 'CONTRACT_DAO_REGISTRY';
export const CONTRACT_VOTING_OP_ROLLUP = 'CONTRACT_VOTING_OP_ROLLUP';
export const CONTRACT_ONBOARDING = 'CONTRACT_ONBOARDING';
export const CONTRACT_BANK_EXTENSION = 'CONTRACT_BANK_EXTENSION';
export const CONTRACT_TRIBUTE = 'CONTRACT_TRIBUTE';

/**
 * @todo Add init for Transfer when ready
 */

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

export function initContractTribute(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const lazyTributeABI = await import(
          '../../truffle-contracts/TributeContract.json'
        );
        const tributeContract: Record<string, any> = lazyTributeABI;
        /**
         * Get address via DAO Registry.
         *
         * @note The `DaoRegistryContract` must be set in Redux first.
         */
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.tribute,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          tributeContract.abi,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_TRIBUTE,
            abi: tributeContract.abi,
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
