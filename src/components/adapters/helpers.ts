import Web3 from 'web3';

import {Adapters} from './types';
import {DaoConstants} from './enums';
import {daoConstants, adapterDescriptions} from './config';

/**
 * getAdapters()
 *
 * @returns Array<Adapters>
 */
export function getAdapters(): Array<Adapters> {
  return daoConstants.map((adapter: DaoConstants) => {
    return {
      adapterId: sha3(adapter) || '', // bytes32
      adapterName: adapter,
      adapterDescription: adapterDescriptions[adapter],
    };
  });
}

/**
 * getConfigurationABIFunction()
 *
 * Returns the ABI functions used to configure adapters
 */
export function getConfigurationABIFunction(): Record<DaoConstants, string> {
  return {
    [DaoConstants.BANK]: '', //@todo
    [DaoConstants.CONFIGURATION]: 'submitConfigurationProposal', // ?!
    [DaoConstants.FINANCING]: 'createFinancingRequest', // ?!
    [DaoConstants.GUILDKICK]: 'submitKickProposal', // ?!
    [DaoConstants.MANAGING]: 'createAdapterChangeRequest', // ?!
    [DaoConstants.OFFCHAIN_VOTING]: 'configureDao',
    [DaoConstants.ONBOARDING]: 'configureDao',
    [DaoConstants.RAGEQUIT]: 'ragequit',
    [DaoConstants.TRIBUTE]: '', //@todo
    [DaoConstants.VOTING]: 'configureDao',
    [DaoConstants.WITHDRAW]: '', //@todo
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
    [DaoConstants.OFFCHAIN_VOTING]: {},
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
