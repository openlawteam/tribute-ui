import Web3 from 'web3';

import {Adapters} from './types';
import {DaoConstants} from './enums';
import {daoConstants, adapterDescriptions} from './config';

// fallback adaptet contract address
// @todo remove when this is done https://github.com/openlawteam/laoland/issues/184
import {
  DEFAULT_CHAIN,
  BANK_EXTENSION_CONTRACT_ADDRESS,
  CONFIGURATION_CONTRACT_ADDRESS,
  FINANCING_CONTRACT_ADDRESS,
  GUILDKICK_CONTRACT_ADDRESS,
  MANAGING_CONTRACT_ADDRESS,
  ONBOARDING_CONTRACT_ADDRESS,
  RAGEQUIT_CONTRACT_ADDRESS,
  TRIBUTE_CONTRACT_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
  WITHDRAW_CONTRACT_ADDRESS,
} from '../../config';

/**
 * getAdapters()
 *
 * @returns Array<Adapters>
 */
export function getAdapters(): Array<Adapters> {
  return daoConstants.map((adapterName: DaoConstants) => {
    return {
      adapterId: getAdapterId(adapterName) || '', // bytes32 type
      adapterName,
      adapterDescription: adapterDescriptions[adapterName],
    };
  });
}

export function getAdapterId(adapterName: DaoConstants): string {
  return sha3(adapterName) as string;
}

/**
 * getAdapterOrExtensionContractAddress
 *
 * [important] fallback adapter contract addresses
 *  @todo remove when this is done https://github.com/openlawteam/laoland/issues/184
 */
export function getAdapterOrExtensionContractAddress() {
  return {
    [DaoConstants.BANK]: BANK_EXTENSION_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.CONFIGURATION]: CONFIGURATION_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.FINANCING]: FINANCING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.GUILDKICK]: GUILDKICK_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.MANAGING]: MANAGING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.ONBOARDING]: ONBOARDING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.RAGEQUIT]: RAGEQUIT_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.TRIBUTE]: TRIBUTE_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.VOTING]: VOTING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    [DaoConstants.WITHDRAW]: WITHDRAW_CONTRACT_ADDRESS[DEFAULT_CHAIN],
  };
}
/**
 * getConfigurationABIFunction()
 *
 * Returns the ABI functions used to configure adapters
 */
export function getConfigurationABIFunction(): Record<DaoConstants, string> {
  return {
    [DaoConstants.BANK]: '', //@todo
    [DaoConstants.CONFIGURATION]: 'submitConfigurationProposal',
    [DaoConstants.FINANCING]: 'createFinancingRequest',
    [DaoConstants.GUILDKICK]: 'submitKickProposal',
    [DaoConstants.MANAGING]: 'createAdapterChangeRequest',
    [DaoConstants.OFFCHAINVOTING]: 'configureDao',
    [DaoConstants.ONBOARDING]: 'configureDao',
    [DaoConstants.RAGEQUIT]: 'ragequit',
    [DaoConstants.TRIBUTE]: 'configureDao',
    [DaoConstants.VOTING]: 'configureDao',
    [DaoConstants.WITHDRAW]: 'withdraw',
  };
}

/**
 * getAdapterAccessControlLayer
 *
 * @param adapterName
 */
export function getAdapterAccessControlLayer(
  adapterName: string
): Record<string, any> {
  const adapterFlags: Record<DaoConstants, any> = {
    [DaoConstants.BANK]: {},
    [DaoConstants.CONFIGURATION]: {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    },
    [DaoConstants.TRIBUTE]: {}, // @todo
    [DaoConstants.FINANCING]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    },
    [DaoConstants.GUILDKICK]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoConstants.MANAGING]: {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REMOVE_ADAPTER: true,
      ADD_ADAPTER: true,
    },
    [DaoConstants.OFFCHAINVOTING]: {},
    [DaoConstants.ONBOARDING]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true,
    },
    [DaoConstants.RAGEQUIT]: {
      SUB_FROM_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoConstants.VOTING]: {},
    [DaoConstants.WITHDRAW]: {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true,
    },
  };

  const flags = adapterFlags[adapterName];

  return {acl: adapterAccess(flags)};
}

/**
 *   === INTERNAL HELPER FUNCTIONS ===
 */

/**
 * adapterAccess()
 *
 * @param flags
 */
function adapterAccess(flags: Record<string, boolean>): number {
  const values = [
    flags.ADD_ADAPTER,
    flags.REMOVE_ADAPTER,
    flags.JAIL_MEMBER,
    flags.UNJAIL_MEMBER,
    flags.SUBMIT_PROPOSAL,
    flags.SPONSOR_PROPOSAL,
    flags.PROCESS_PROPOSAL,
    flags.UPDATE_DELEGATE_KEY,
    flags.SET_CONFIGURATION,
    flags.ADD_EXTENSION,
    flags.REMOVE_EXTENSION,
    flags.NEW_MEMBER,
  ];

  return entry(values) as number;
}

/**
 * sha3()
 *
 * @returns string | null
 * @param value
 */
function sha3(value: string): string | null {
  return Web3.utils.sha3(value);
}

/**
 * entry()
 *
 * @param values
 */
function entry(values: Boolean[]): number {
  return values
    .map((v: any, idx: number) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a: any, b: any) => a + b);
}
