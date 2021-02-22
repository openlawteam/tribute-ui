import {DaoConstants} from './enums';

// An array of all available DAO adapters
export const daoConstants: Array<DaoConstants> = [
  DaoConstants.BANK,
  DaoConstants.CONFIGURATION,
  DaoConstants.FINANCING,
  DaoConstants.GUILDKICK,
  DaoConstants.MANAGING,
  DaoConstants.OFFCHAINVOTING,
  DaoConstants.ONBOARDING,
  DaoConstants.RAGEQUIT,
  DaoConstants.TRIBUTE,
  DaoConstants.VOTING,
  DaoConstants.WITHDRAW,
];

// Adapter descriptions taken from https://github.com/openlawteam/laoland
export const adapterDescriptions: Record<DaoConstants, string> = {
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
  [DaoConstants.OFFCHAINVOTING]:
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
