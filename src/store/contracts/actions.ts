import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';
import {Dispatch} from 'redux';

import {
  ContractAdapterNames,
  ContractExtensionNames,
} from '../../components/web3/types';
import {ContractsStateEntry, StoreState} from '../types';
import {DEFAULT_CHAIN, DAO_REGISTRY_CONTRACT_ADDRESS} from '../../config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {getExtensionAddress} from '../../components/web3/helpers/getExtensionAddress';

type ContractAction =
  | typeof CONTRACT_BANK_EXTENSION
  | typeof CONTRACT_DAO_REGISTRY
  | typeof CONTRACT_MANAGING
  | typeof CONTRACT_ONBOARDING
  | typeof CONTRACT_TRIBUTE
  | typeof CONTRACT_VOTING
  | typeof CONTRACT_VOTING_OP_ROLLUP;

export const CONTRACT_BANK_EXTENSION = 'CONTRACT_BANK_EXTENSION';
export const CONTRACT_DAO_REGISTRY = 'CONTRACT_DAO_REGISTRY';
export const CONTRACT_MANAGING = 'CONTRACT_MANAGING';
export const CONTRACT_ONBOARDING = 'CONTRACT_ONBOARDING';
export const CONTRACT_TRIBUTE = 'CONTRACT_TRIBUTE';
export const CONTRACT_VOTING = 'CONTRACT_VOTING';
export const CONTRACT_VOTING_OP_ROLLUP = 'CONTRACT_VOTING_OP_ROLLUP';

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

export function initContractVoting(web3Instance: Web3, votingAddress?: string) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyVotingABI} = await import(
          '../../truffle-contracts/VotingContract.json'
        );
        const votingContract: AbiItem[] = lazyVotingABI as any;

        /**
         * Uses `address` if provided;
         * mainly for use with `initRegisteredVotingAdapter`.
         */
        const contractAddress =
          votingAddress ||
          (await getAdapterAddress(
            ContractAdapterNames.voting,
            getState().contracts.DaoRegistryContract?.instance
          ));

        const instance = new web3Instance.eth.Contract(
          votingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_VOTING_OP_ROLLUP,
            abi: votingContract,
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

export function initContractVotingOpRollup(
  web3Instance: Web3,
  votingAddress?: string
) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyOffchainVotingABI} = await import(
          '../../truffle-contracts/OffchainVotingContract.json'
        );
        const offchainVotingContract: AbiItem[] = lazyOffchainVotingABI as any;

        /**
         * Uses `address` if provided;
         * mainly for use with `initRegisteredVotingAdapter`.
         */
        const contractAddress =
          votingAddress ||
          (await getAdapterAddress(
            ContractAdapterNames.voting,
            getState().contracts.DaoRegistryContract?.instance
          ));

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

export function initContractBankExtension(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyBankExtensionABI} = await import(
          '../../truffle-contracts/BankExtension.json'
        );
        const bankExtensionContract: AbiItem[] = lazyBankExtensionABI as any;

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
        const {default: lazyTributeABI} = await import(
          '../../truffle-contracts/TributeContract.json'
        );
        const tributeContract: AbiItem[] = lazyTributeABI as any;

        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.tribute,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          tributeContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_TRIBUTE,
            abi: tributeContract,
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

export function initContractManaging(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const {default: lazyManagingABI} = await import(
          '../../truffle-contracts/ManagingContract.json'
        );
        const managingContract: AbiItem[] = lazyManagingABI as any;
        const contractAddress = await getAdapterAddress(
          ContractAdapterNames.managing,
          getState().contracts.DaoRegistryContract?.instance
        );
        const instance = new web3Instance.eth.Contract(
          managingContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_MANAGING,
            abi: managingContract,
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

/**
 * Inits the currently registered `voting` contract.
 *
 * @note The DaoRegistry and Managing contracts must be initialised beforehand.
 */
export function initRegisteredVotingAdapter(web3Instance: Web3) {
  return async function (_dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const daoRegistryInstance = getState().contracts.DaoRegistryContract
          ?.instance;
        const managingInstance = getState().contracts.ManagingContract
          ?.instance;

        if (!daoRegistryInstance) {
          throw new Error(
            'Please init the DaoRegistry contract before the voting contract.'
          );
        }

        if (!managingInstance) {
          throw new Error(
            'Please init the Managing contract before the voting contract.'
          );
        }

        // @todo Try to use multi-call for the below calls?
        const votingContractAddress = await getAdapterAddress(
          ContractAdapterNames.voting,
          daoRegistryInstance
        );

        const votingAdapterName = await managingInstance.methods
          .getVotingAdapterName(
            getState().contracts.DaoRegistryContract?.contractAddress
          )
          .call();

        /**
         * @todo Move voting adapter enum names (see contracts: `ADAPTER_NAME`)
         *   to an appropriate adapter config file.
         */
        switch (votingAdapterName) {
          case 'VotingContract':
            return await initContractVoting(
              web3Instance,
              votingContractAddress
            )(_dispatch, getState);
          case 'OffchainVotingContract':
            return await initContractVotingOpRollup(
              web3Instance,
              votingContractAddress
            )(_dispatch, getState);
          default:
            throw new Error('Voting contract name could not be found.');
        }
      }
    } catch (error) {
      throw error;
    }
  };
}
