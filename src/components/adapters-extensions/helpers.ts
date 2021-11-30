import Web3 from 'web3';

import {DaoAdapterConstants, DaoExtensionConstants} from './enums';
import {AclFlag} from './types';

export function getAdapterOrExtensionId(
  adapterName: DaoAdapterConstants | DaoExtensionConstants
): string {
  return sha3(adapterName) as string;
}

/**
 * getAccessControlLayer
 *
 * @param adapterName
 */
export function getAccessControlLayer(
  adapterOrExtensionName: string
): Record<string, any> {
  const adapterAndExtensionFlags: Record<
    | DaoAdapterConstants
    | DaoExtensionConstants.BANK
    | DaoExtensionConstants.NFT,
    any
  > = {
    [DaoExtensionConstants.BANK]: {},
    [DaoAdapterConstants.CONFIGURATION]: {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    },
    [DaoAdapterConstants.DISTRIBUTE]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoAdapterConstants.EXECUTION]: {},
    [DaoAdapterConstants.TRIBUTE]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      NEW_MEMBER: true,
      ADD_TO_BALANCE: true,
      REGISTER_NEW_TOKEN: true,
    },
    [DaoAdapterConstants.FINANCING]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    },
    [DaoAdapterConstants.GUILDKICK]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoAdapterConstants.MANAGING]: {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REMOVE_ADAPTER: true,
      ADD_ADAPTER: true,
    },
    [DaoAdapterConstants.OFFCHAINVOTING]: {},
    [DaoAdapterConstants.ONBOARDING]: {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true,
    },
    [DaoAdapterConstants.NONVOTING_ONBOARDING]: {},
    [DaoAdapterConstants.RAGEQUIT]: {
      SUB_FROM_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoAdapterConstants.VOTING]: {},
    [DaoAdapterConstants.BANK]: {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true,
      UPDATE_TOKEN: true,
    },
    [DaoAdapterConstants.NFT]: {
      COLLECT_NFT: true,
    },
    [DaoAdapterConstants.COUPON_ONBOARDING]: {
      SUBMIT_PROPOSAL: false,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: false,
      NEW_MEMBER: true,
    },
    [DaoAdapterConstants.KYC_ONBOARDING]: {
      ADD_TO_BALANCE: true,
      NEW_MEMBER: true,
    },
    [DaoAdapterConstants.TRIBUTE_NFT]: {
      SUBMIT_PROPOSAL: true,
      NEW_MEMBER: true,
      ADD_TO_BALANCE: true,
      COLLECT_NFT: true,
    },
    [DaoExtensionConstants.NFT]: {
      WITHDRAW_NFT: true,
      COLLECT_NFT: true,
      INTERNAL_TRANSFER: true,
    },
    [DaoAdapterConstants.DAO_REGISTRY]: {
      UPDATE_DELEGATE_KEY: true,
    },
  };

  const flags = adapterAndExtensionFlags[adapterOrExtensionName];

  return {acl: accessFlags(flags)};
}

/**
 *   === INTERNAL HELPER FUNCTIONS ===
 */

/**
 * accessFlags()
 *
 * @param flags
 */
function accessFlags(flags: Record<AclFlag, boolean>): number {
  const ADAPTER_ACCESS_FLAGS = [
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
  const EXTENSION_ACCESS_FLAGS = [flags.TRANSFER_NFT];

  const values: boolean[] = [
    ...ADAPTER_ACCESS_FLAGS,
    ...EXTENSION_ACCESS_FLAGS,
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
