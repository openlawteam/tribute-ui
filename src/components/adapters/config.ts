import Web3 from 'web3';

/**
 * DaoConstants as defined in the solidity DaoConstants.sol contract
 * and the available adapters as detailed here:
 * https://github.com/openlawteam/laoland
 */
export enum DaoConstants {
  BANK = 'bank',
  CONFIGURATION = 'configuration',
  FINANCING = 'financing',
  GUILDKICK = 'guildkick',
  ONBOARDING = 'onboarding',
  OFFCHAIN_VOTING = 'offchain-voting',
  MANAGING = 'managing',
  RAGEQUIT = 'ragequit',
  TRIBUTE = 'tribute',
  VOTING = 'voting',
  WITHDRAW = 'withdraw',
}

// Array of all adapters
const daoConstants: Array<DaoConstants> = [
  DaoConstants.BANK,
  DaoConstants.CONFIGURATION,
  DaoConstants.FINANCING,
  DaoConstants.GUILDKICK,
  DaoConstants.MANAGING,
  DaoConstants.OFFCHAIN_VOTING,
  DaoConstants.ONBOARDING,
  DaoConstants.RAGEQUIT,
  DaoConstants.TRIBUTE,
  DaoConstants.VOTING,
  DaoConstants.WITHDRAW,
];

export type Adapters = {
  adapterId: string;
  adapterName: DaoConstants;
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
      adapterId: sha3(adapter) || '', // bytes32
      adapterName: adapter,
      adapterDescription: adapterDescriptions[adapter],
    };
  });
}

// Adapter descriptions taken from https://github.com/openlawteam/laoland
const adapterDescriptions: Record<DaoConstants, string> = {
  [DaoConstants.BANK]:
    'Adds the banking capabilities to the DAO, and keeps track of the DAO accounts and internal token balances.',
  [DaoConstants.CONFIGURATION]:
    'Manages storing and retrieving per-DAO settings required by shared adapters.',
  [DaoConstants.FINANCING]:
    'Allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.',
  [DaoConstants.GUILDKICK]:
    'Gives the members the freedom to choose which individuals or organizations should really be part of the DAO.',
  [DaoConstants.MANAGING]:
    'Enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.',
  [DaoConstants.OFFCHAIN_VOTING]:
    'Adds the offchain voting governance process to the DAO to support gasless voting.',
  [DaoConstants.ONBOARDING]:
    'Triggers the process of minting internal tokens in exchange of a specific token at a fixed price.',
  [DaoConstants.RAGEQUIT]:
    'Gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.',
  [DaoConstants.TRIBUTE]:
    'Allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens.',
  [DaoConstants.VOTING]:
    'Adds the simple on chain voting governance process to the DAO.',
  [DaoConstants.WITHDRAW]:
    'Allows the members to withdraw their funds from the DAO bank.',
};

/**
 * configurationABIFunction()
 *
 * Returns the ABI functions used to configure adapters
 */
export function configurationABIFunction(): Record<DaoConstants, string> {
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

export function adapterAccessControlLayer(
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

function entry(values: Boolean[]): number {
  return values
    .map((v: any, idx: number) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a: any, b: any) => a + b);
}
