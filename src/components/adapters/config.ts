import Web3 from 'web3';

// DaoConstants defined solidity DaoConstants.sol contract
export enum DaoConstants {
  BANK = 'bank',
  CONFIGURATION = 'configuration',
  // EXECUTION = 'execution',
  FINANCING = 'financing',
  GUILDKICK = 'guildkick',
  ONBOARDING = 'onboarding',
  OFFCHAIN_VOTING = 'offchain-voting',
  // NONVOTING_ONBOARDING = 'nonvoting-onboarding',
  MANAGING = 'managing',
  RAGEQUIT = 'ragequit',
  VOTING = 'voting',
}

// Array of all adapters
const daoConstants: Array<DaoConstants> = [
  DaoConstants.BANK,
  DaoConstants.CONFIGURATION,
  // DaoConstants.EXECUTION,
  DaoConstants.FINANCING,
  DaoConstants.GUILDKICK,
  DaoConstants.MANAGING,
  // DaoConstants.NONVOTING_ONBOARDING,
  DaoConstants.OFFCHAIN_VOTING,
  DaoConstants.ONBOARDING,
  DaoConstants.RAGEQUIT,
  DaoConstants.VOTING,
];

export type Adapters = {
  adapterId: string | null;
  adapterName: string;
  adapterDescription: string;
};

/**
 * getAdapters()
 *
 * @returns Array<Adapters>
 */
export function getAdapters(): Array<Adapters> {
  return daoConstants.map((adapter: DaoConstants) => {
    return {
      adapterId: sha3(adapter), // bytes32
      adapterName: adapter,
      adapterDescription:
        'Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla consectetur id nec massa. Aliquam erat volutpat.',
    };
  });
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
 * configurationABIFunction()
 *
 * Returns the ABI functions used to configure adapters
 */
export function configurationABIFunction(): Record<DaoConstants, string> {
  return {
    [DaoConstants.BANK]: '', //@todo
    [DaoConstants.CONFIGURATION]: 'submitConfigurationProposal', // ?!
    // [DaoConstants.EXECUTION]: '', //@todo
    [DaoConstants.FINANCING]: 'createFinancingRequest', // ?!
    [DaoConstants.GUILDKICK]: 'submitKickProposal', // ?!
    [DaoConstants.MANAGING]: 'createAdapterChangeRequest', // ?!
    // [DaoConstants.NONVOTING_ONBOARDING]: '', //@todo
    [DaoConstants.OFFCHAIN_VOTING]: 'configureDao',
    [DaoConstants.ONBOARDING]: 'configureDao',
    [DaoConstants.RAGEQUIT]: 'configureDao',
    [DaoConstants.VOTING]: 'configureDao',
  };
}

export function adapterAccessControlLayer(
  adapterName: string
): Record<string, any> {
  //@note missing withdraw adapter.. was moved into Bank as an extension

  const adapterFlags = {
    [DaoConstants.BANK]: {},
    [DaoConstants.CONFIGURATION]: {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    },
    // [DaoConstants.EXECUTION]: {},
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
    // [DaoConstants.NONVOTING_ONBOARDING]: {},
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
  };

  const flags = adapterFlags[adapterName];

  return {acl: adapterAccess(flags)};
}

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

function entry(values: Boolean[]): number {
  return values
    .map((v: any, idx: number) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a: any, b: any) => a + b);
}
