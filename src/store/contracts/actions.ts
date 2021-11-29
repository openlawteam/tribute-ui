import {AbiItem} from 'web3-utils/types';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {Dispatch} from 'redux';
import Web3 from 'web3';

import {
  ContractAdapterNames,
  ContractExtensionNames,
} from '../../components/web3/types';
import {
  DEFAULT_CHAIN,
  BANK_FACTORY_CONTRACT_ADDRESS,
  DAO_FACTORY_CONTRACT_ADDRESS,
  DAO_REGISTRY_CONTRACT_ADDRESS,
} from '../../config';
import {
  getAdapterAddress,
  getVotingAdapterName,
} from '../../components/web3/helpers';
import {
  DaoAdapterConstants,
  DaoExtensionConstants,
  VotingAdapterName,
} from '../../components/adapters-extensions/enums';
import {ContractsStateEntry} from './types';
import {getExtensionAddress} from '../../components/web3/helpers/getExtensionAddress';
import {StoreState} from '../types';

type ContractAction =
  | typeof CLEAR_CONTRACTS
  | typeof CONTRACT_BANK_ADAPTER
  | typeof CONTRACT_BANK_EXTENSION
  | typeof CONTRACT_BANK_FACTORY
  | typeof CONTRACT_CONFIGURATION
  | typeof CONTRACT_COUPON_ONBOARDING
  | typeof CONTRACT_DAO_FACTORY
  | typeof CONTRACT_DAO_REGISTRY
  | typeof CONTRACT_DAO_REGISTRY_ADAPTER
  | typeof CONTRACT_DISTRIBUTE
  | typeof CONTRACT_ERC20_EXTENSION
  | typeof CONTRACT_FINANCING
  | typeof CONTRACT_GUILDKICK
  | typeof CONTRACT_MANAGING
  | typeof CONTRACT_NFT_EXTENSION
  | typeof CONTRACT_ONBOARDING
  | typeof CONTRACT_RAGEQUIT
  | typeof CONTRACT_TRIBUTE
  | typeof CONTRACT_TRIBUTE_NFT
  | typeof CONTRACT_VOTING
  | typeof CONTRACT_VOTING_OP_ROLLUP;

export const CLEAR_CONTRACTS = 'CLEAR_CONTRACTS';
export const CONTRACT_BANK_ADAPTER = 'CONTRACT_BANK_ADAPTER';
export const CONTRACT_BANK_EXTENSION = 'CONTRACT_BANK_EXTENSION';
export const CONTRACT_BANK_FACTORY = 'CONTRACT_BANK_FACTORY';
export const CONTRACT_CONFIGURATION = 'CONTRACT_CONFIGURATION';
export const CONTRACT_COUPON_ONBOARDING = 'CONTRACT_COUPON_ONBOARDING';
export const CONTRACT_DAO_FACTORY = 'CONTRACT_DAO_FACTORY';
export const CONTRACT_DAO_REGISTRY = 'CONTRACT_DAO_REGISTRY';
export const CONTRACT_DAO_REGISTRY_ADAPTER = 'CONTRACT_DAO_REGISTRY_ADAPTER';
export const CONTRACT_DISTRIBUTE = 'CONTRACT_DISTRIBUTE';
export const CONTRACT_ERC20_EXTENSION = 'CONTRACT_ERC20_EXTENSION';
export const CONTRACT_FINANCING = 'CONTRACT_FINANCING';
export const CONTRACT_GUILDKICK = 'CONTRACT_GUILDKICK';
export const CONTRACT_MANAGING = 'CONTRACT_MANAGING';
export const CONTRACT_NFT_EXTENSION = 'CONTRACT_NFT_EXTENSION';
export const CONTRACT_ONBOARDING = 'CONTRACT_ONBOARDING';
export const CONTRACT_RAGEQUIT = 'CONTRACT_RAGEQUIT';
export const CONTRACT_TRIBUTE = 'CONTRACT_TRIBUTE';
export const CONTRACT_TRIBUTE_NFT = 'CONTRACT_TRIBUTE_NFT';
export const CONTRACT_VOTING = 'CONTRACT_VOTING';
export const CONTRACT_VOTING_OP_ROLLUP = 'CONTRACT_VOTING_OP_ROLLUP';

export function clearContracts(): Record<'type', typeof CLEAR_CONTRACTS> {
  return {
    type: CLEAR_CONTRACTS,
  };
}

export function initContractBankFactory(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyBankFactoryABI} = await import(
          '../../abis/BankFactory.json'
        );
        const bankFactoryContract: AbiItem[] = lazyBankFactoryABI as any;
        const contractAddress = BANK_FACTORY_CONTRACT_ADDRESS[DEFAULT_CHAIN];
        const instance = new web3Instance.eth.Contract(
          bankFactoryContract,
          contractAddress
        );

        dispatch(
          createContractAction({
            type: CONTRACT_BANK_FACTORY,
            abi: bankFactoryContract,
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

export function initContractDaoFactory(web3Instance: Web3) {
  return async function (dispatch: Dispatch<any>) {
    try {
      if (web3Instance) {
        const {default: lazyDaoFactoryABI} = await import(
          '../../abis/DaoFactory.json'
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
          '../../abis/DaoRegistry.json'
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
    lazyImport: () => import('../../abis/VotingContract.json'),
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
    lazyImport: () => import('../../abis/OffchainVotingContract.json'),
    web3Instance,
  });
}

export function initContractOnboarding(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_ONBOARDING,
    adapterNameForRedux: DaoAdapterConstants.ONBOARDING,
    adapterOrExtensionName: ContractAdapterNames.onboarding,
    contractAddress,
    lazyImport: () => import('../../abis/OnboardingContract.json'),
    web3Instance,
  });
}

export function initContractBankExtension(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_BANK_EXTENSION,
    adapterNameForRedux: DaoExtensionConstants.BANK,
    adapterOrExtensionName: ContractExtensionNames.bank,
    contractAddress,
    isExtension: true,
    lazyImport: () => import('../../abis/BankExtension.json'),
    web3Instance,
  });
}

export function initContractTribute(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_TRIBUTE,
    adapterNameForRedux: DaoAdapterConstants.TRIBUTE,
    adapterOrExtensionName: ContractAdapterNames.tribute,
    contractAddress,
    lazyImport: () => import('../../abis/TributeContract.json'),
    web3Instance,
  });
}

export function initContractDistribute(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_DISTRIBUTE,
    adapterNameForRedux: DaoAdapterConstants.DISTRIBUTE,
    adapterOrExtensionName: ContractAdapterNames.distribute,
    contractAddress,
    lazyImport: () => import('../../abis/DistributeContract.json'),
    web3Instance,
  });
}

export function initContractManaging(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_MANAGING,
    adapterNameForRedux: DaoAdapterConstants.MANAGING,
    adapterOrExtensionName: ContractAdapterNames.managing,
    contractAddress,
    lazyImport: () => import('../../abis/ManagingContract.json'),
    web3Instance,
  });
}

export function initContractBankAdapter(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_BANK_ADAPTER,
    adapterNameForRedux: DaoAdapterConstants.BANK,
    adapterOrExtensionName: ContractAdapterNames.bank,
    contractAddress,
    lazyImport: () => import('../../abis/BankAdapterContract.json'),
    web3Instance,
  });
}

export function initContractDaoRegistryAdapter(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_DAO_REGISTRY_ADAPTER,
    adapterNameForRedux: DaoAdapterConstants.DAO_REGISTRY,
    adapterOrExtensionName: ContractAdapterNames.dao_registry,
    contractAddress,
    lazyImport: () => import('../../abis/DaoRegistryAdapterContract.json'),
    web3Instance,
  });
}

export function initContractRagequit(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_RAGEQUIT,
    adapterNameForRedux: DaoAdapterConstants.RAGEQUIT,
    adapterOrExtensionName: ContractAdapterNames.ragequit,
    contractAddress,
    lazyImport: () => import('../../abis/RagequitContract.json'),
    web3Instance,
  });
}

export function initContractGuildKick(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_GUILDKICK,
    adapterNameForRedux: DaoAdapterConstants.GUILDKICK,
    adapterOrExtensionName: ContractAdapterNames.guildkick,
    contractAddress,
    lazyImport: () => import('../../abis/GuildKickContract.json'),
    web3Instance,
  });
}

export function initContractFinancing(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_FINANCING,
    adapterNameForRedux: DaoAdapterConstants.FINANCING,
    adapterOrExtensionName: ContractAdapterNames.financing,
    contractAddress,
    lazyImport: () => import('../../abis/FinancingContract.json'),
    web3Instance,
  });
}

export function initContractConfiguration(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_CONFIGURATION,
    adapterNameForRedux: DaoAdapterConstants.CONFIGURATION,
    adapterOrExtensionName: ContractAdapterNames.configuration,
    contractAddress,
    lazyImport: () => import('../../abis/ConfigurationContract.json'),
    web3Instance,
  });
}

export function initContractTributeNFT(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_TRIBUTE_NFT,
    adapterNameForRedux: DaoAdapterConstants.TRIBUTE_NFT,
    adapterOrExtensionName: ContractAdapterNames.tribute_nft,
    contractAddress,
    lazyImport: () => import('../../abis/TributeNFTContract.json'),
    web3Instance,
  });
}

export function initContractCouponOnboarding(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_COUPON_ONBOARDING,
    adapterNameForRedux: DaoAdapterConstants.COUPON_ONBOARDING,
    adapterOrExtensionName: ContractAdapterNames.coupon_onboarding,
    contractAddress,
    lazyImport: () => import('../../abis/CouponOnboardingContract.json'),
    web3Instance,
  });
}

export function initContractNFTExtension(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_NFT_EXTENSION,
    adapterNameForRedux: DaoExtensionConstants.NFT,
    adapterOrExtensionName: ContractExtensionNames.nft,
    contractAddress,
    isExtension: true,
    lazyImport: () => import('../../abis/NFTExtension.json'),
    web3Instance,
  });
}

export function initContractERC20Extension(
  web3Instance: Web3,
  contractAddress?: string
) {
  return initContractThunkFactory({
    actionType: CONTRACT_ERC20_EXTENSION,
    adapterNameForRedux: DaoExtensionConstants.ERC20,
    adapterOrExtensionName: ContractExtensionNames.erc20,
    contractAddress,
    isExtension: true,
    lazyImport: () => import('../../abis/ERC20Extension.json'),
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

        if (!daoRegistryContract) {
          console.warn(
            'Please init the DaoRegistry contract before the voting contract.'
          );
          return;
        }

        let votingAdapterName: string = '';
        let address: string = contractAddress || '';

        if (address) {
          votingAdapterName = await getVotingAdapterName(address, web3Instance);
        }

        if (!address && !votingAdapterName) {
          address = await getAdapterAddress(
            ContractAdapterNames.voting,
            getState().contracts.DaoRegistryContract?.instance
          );

          votingAdapterName = await getVotingAdapterName(address, web3Instance);
        }

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
      console.warn(
        `The voting contract could not be found in the DAO. Are you sure you meant to add this contract's ABI?`
      );
    }
  };
}

export function createContractAction<T = Web3Contract>({
  type,
  ...payload
}: {
  type: ContractAction;
} & ContractsStateEntry<T>) {
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
   * The name to be shown in Redux state as `adapterOrExtensionName`.
   */
  adapterNameForRedux?: ContractsStateEntry['adapterOrExtensionName'];
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
              adapterOrExtensionName as any as ContractExtensionNames,
              getState().contracts.DaoRegistryContract?.instance
            )
          : await getAdapterAddress(
              adapterOrExtensionName as any as ContractAdapterNames,
              getState().contracts.DaoRegistryContract?.instance
            ));

      dispatch(
        createContractAction({
          type: actionType,
          abi: contractABI,
          contractAddress: address,
          adapterOrExtensionName: adapterNameForRedux,
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
