import Web3 from 'web3';
import {AbiItem} from 'web3-utils/types';
import {Dispatch} from 'redux';

import {
  ContractAdapterNames,
  ContractExtensionNames,
} from '../../components/web3/types';
import {ContractsStateEntry, StoreState} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../config';
import {getAdapterAddress} from '../../components/web3/helpers';
import {getExtensionAddress} from '../../components/web3/helpers/getExtensionAddress';
import {DaoConstants, VotingAdapterName} from '../../components/adpaters/enums';

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

export function initContractDaoRegistry(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyDaoRegistryABI} = await import(
          '../../truffle-contracts/DaoRegistry.json'
        );

        const daoRegistryContract: AbiItem[] = lazyDaoRegistryABI as any;
        const contractAddress = DAO_REGISTRY_CONTRACT_ADDRESS;

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

export function initContractVoting(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_VOTING,
    adapterOrExtensionName: ContractAdapterNames.voting,
    adapterNameForRedux: VotingAdapterName.VotingContract,
    contractAddress,
    lazyImport: () => import('../../truffle-contracts/VotingContract.json'),
    web3Instance,
  });
}

export function initContractVotingOpRollup(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_VOTING_OP_ROLLUP,
    adapterOrExtensionName: ContractAdapterNames.voting,
    adapterNameForRedux: VotingAdapterName.OffchainVotingContract,
    contractAddress,
    lazyImport: () =>
      import('../../truffle-contracts/OffchainVotingContract.json'),
    web3Instance,
  });
}

export function initContractOnboarding(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_ONBOARDING,
    adapterNameForRedux: DaoConstants.ONBOARDING,
    adapterOrExtensionName: ContractAdapterNames.ragequit,
    contractAddress,
    lazyImport: () => import('../../truffle-contracts/OnboardingContract.json'),
    web3Instance,
  });
}

export function initContractBankExtension(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_BANK_EXTENSION,
    adapterNameForRedux: DaoConstants.BANK,
    adapterOrExtensionName: ContractExtensionNames.bank,
    contractAddress,
    isExtension: true,
    lazyImport: () => import('../../truffle-contracts/BankExtension.json'),
    web3Instance,
  });
}

export function initContractTribute(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_TRIBUTE,
    adapterNameForRedux: DaoConstants.TRIBUTE,
    adapterOrExtensionName: ContractAdapterNames.tribute,
    contractAddress,
    lazyImport: () => import('../../truffle-contracts/TributeContract.json'),
    web3Instance,
  });
}

export function initContractManaging(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_MANAGING,
    adapterNameForRedux: DaoConstants.MANAGING,
    adapterOrExtensionName: ContractAdapterNames.managing,
    contractAddress,
    lazyImport: () => import('../../truffle-contracts/ManagingContract.json'),
    web3Instance,
  });
}

/**
 * Inits the currently registered `voting` contract.
 *
 * @note The DaoRegistry and Managing contracts must be initialised beforehand.
 */
export function initRegisteredVotingAdapter(
  web3Instance: Web3,
  contractAddress?: string
) {
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      if (web3Instance) {
        const daoRegistryContract = getState().contracts.DaoRegistryContract;
        const managingContract = getState().contracts.ManagingContract;

        if (!daoRegistryContract) {
          console.warn(
            'Please init the DaoRegistry contract before the voting contract.'
          );
          return;
        }

        if (!managingContract) {
          console.warn(
            'Please init the Managing contract before the voting contract.'
          );
          return;
        }

        const address =
          contractAddress ||
          (await getAdapterAddress(
            ContractAdapterNames.voting,
            daoRegistryContract.instance
          ));

        const votingAdapterName = await managingContract.instance.methods
          .getVotingAdapterName(daoRegistryContract.contractAddress)
          .call();

        /**
         * @todo Move voting adapter enum names (see contracts: `ADAPTER_NAME`)
         *   to an appropriate adapter config file.
         */
        switch (votingAdapterName) {
          case 'VotingContract':
            return await initContractVoting(web3Instance, address)(
              dispatch,
              getState
            );
          case 'OffchainVotingContract':
            return await initContractVotingOpRollup(web3Instance, address)(
              dispatch,
              getState
            );
          default:
            throw new Error('Voting contract name could not be found.');
        }
      }
    } catch (error) {
      throw error;
    }
  };
}

export function createContractAction({
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

export function initContractThunkFactory({
  actionType,
  adapterNameForRedux,
  adapterOrExtensionName,
  contractAddress,
  isExtension = false,
  lazyImport,
  web3Instance,
}: {
  actionType: ContractAction;
  adapterOrExtensionName: ContractAdapterNames | ContractExtensionNames;
  /**
   * The name to be shown in Redux state as `adapterName`.
   */
  adapterNameForRedux?: ContractsStateEntry['adapterName'];
  contractAddress?: string;
  /**
   * If set to `true` an Extenion address will be searched for instead of an Adapter.
   */
  isExtension?: boolean;
  /**
   * Provide a Dynamic Import wrapped in a function.
   *
   * e.g. `() => import('./path/to/import')`
   */
  lazyImport: () => any;
  web3Instance: Web3;
}) {
  // Return a Redux Thunk
  return async function (dispatch: Dispatch<any>, getState: () => StoreState) {
    try {
      const {default: lazyABI} = await lazyImport();

      const contractABI: AbiItem[] = lazyABI as any;

      const address =
        contractAddress ||
        (isExtension
          ? await getExtensionAddress(
              (adapterOrExtensionName as unknown) as ContractExtensionNames,
              getState().contracts.DaoRegistryContract?.instance
            )
          : await getAdapterAddress(
              (adapterOrExtensionName as unknown) as ContractAdapterNames,
              getState().contracts.DaoRegistryContract?.instance
            ));

      dispatch(
        createContractAction({
          type: actionType,
          abi: contractABI,
          contractAddress: address,
          adapterName: adapterNameForRedux,
          instance: new web3Instance.eth.Contract(contractABI, address),
        })
      );
    } catch (error) {
      // Warn instead of throwing as we want the Dapp to fail gracefully.
      console.warn(
        `The contract "${adapterOrExtensionName}" could not be found in the DAO. Are you sure you meant to add this contract's ABI?`
      );
    }
  };
}
