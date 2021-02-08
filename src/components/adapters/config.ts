import Web3 from 'web3';

/**
 * @todo This config file is termporary and should be replaced
 * with the api calls from the Laoland DAO API, once its ready.
 **/

//@note missing withdraw adapter.. was moved into Bank as an extension

export type Adapters = {
  adapterId: string | null;
  adapterName: string;
  adapterDescription: string;
};

// DaoConstants defined solidity DaoConstants.sol contract
export enum DaoConstants {
  BANK = 'bank',
  CONFIGURATION = 'configuration',
  EXECUTION = 'execution',
  FINANCING = 'financing',
  GUILDKICK = 'guildkick',
  ONBOARDING = 'onboarding',
  NONVOTING_ONBOARDING = 'nonvoting-onboarding',
  MANAGING = 'managing',
  RAGEQUIT = 'ragequit',
  VOTING = 'voting',
}

// Array of all adapters
const daoConstants: Array<DaoConstants> = [
  DaoConstants.BANK,
  DaoConstants.CONFIGURATION,
  DaoConstants.EXECUTION,
  DaoConstants.FINANCING,
  DaoConstants.GUILDKICK,
  DaoConstants.MANAGING,
  DaoConstants.NONVOTING_ONBOARDING,
  DaoConstants.ONBOARDING,
  DaoConstants.RAGEQUIT,
  DaoConstants.VOTING,
];

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
 * 
 *
// use `getAdapterAddress([0]]bytes32 adapterId)` to get these contract addreses 

let voting = "0xdAA7a83C306e7ea2AF6473B3Dc81c3013dF1FC13";
let ragequit = "0x5Cf75b1CccbfDB8d9CfA25C19fb4406dCA83140b";
let guildkick = "0xF4D5B0DfF96c7Ee175E92B714A9cEAFe74769303";
let managing = "0x5e7654cBA1984C9528C5594F111f21036bEEcA09";
let financing = "0x18707799f8bE12d618f7696de6579cdF5223aB75";
let onboarding = "0x0fB9C41e67BA9941189932A2bFAB1C8F75A17B76";
let withdraw = "0x0F8EC5d62e9763f041E15FaE3eb2cD625051816f";
let configuration = "0xc06F981A361E7225faa270ee01310c23b8fa32A5";

const x = [
    entryDao("voting", voting, {}),
    entryDao("configuration", configuration, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      SET_CONFIGURATION: true,
    }),
    entryDao("ragequit", ragequit, {
      SUB_FROM_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    }),
    entryDao("guildkick", guildkick, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SUB_FROM_BALANCE: true,
      ADD_TO_BALANCE: true,
      JAIL_MEMBER: true,
      UNJAIL_MEMBER: true,
      INTERNAL_TRANSFER: true,
    }),
    entryDao("managing", managing, {
      SUBMIT_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      REMOVE_ADAPTER: true,
      ADD_ADAPTER: true,
    }),
    entryDao("financing", financing, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
    }),
    entryDao("onboarding", onboarding, {
      SUBMIT_PROPOSAL: true,
      SPONSOR_PROPOSAL: true,
      PROCESS_PROPOSAL: true,
      ADD_TO_BALANCE: true,
      UPDATE_DELEGATE_KEY: true,
      NEW_MEMBER: true
    }),
    entryDao("withdraw", withdraw, {
      WITHDRAW: true,
      SUB_FROM_BALANCE: true
    })
  ];
  
  console.log('x', x)
  
function entryDao(name, contract, flags) {
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
    flags.NEW_MEMBER
  ];

  const acl = entry(values);

  return {
    id: sha3(name),
    addr: contract.address,
    flags: acl,
  };
}

function entry(values) {
  return values
    .map((v, idx) => (v !== undefined ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
}
 */
