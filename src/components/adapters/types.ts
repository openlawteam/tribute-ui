export type AddAdapterArguments = [
  // `adapterId`
  string,
  // `adapterAddress`
  string,
  // `acl`
  number
];

export type ConfigurationArguments = [
  // `dao`
  string,
  // `proposalId`
  string,
  // `keys`
  string[],
  // `values`
  number[]
];

export type GuildKickArguments = [
  // `dao`
  string,
  // `proposalId`
  string,
  // `memberToKick`
  string,
  // `data`
  string
];

export type RagequitArguments = [
  // `dao`
  string,
  // `sharesToBurn`
  number,
  // `lootToBurn`
  number,
  // `tokens`
  string[]
];

export type FinancingArguments = [
  // `dao`
  string,
  // `proposalId`
  string,
  // `applicant`
  string,
  // `token`
  string,
  // `amount`
  number,
  // `details`
  string
];

export type ManagingArguments = [
  // `dao`
  string,
  // `proposalId`
  string,
  // `adapterId`
  string,
  // `adapterAddress`
  string,
  // `keys`
  string[],
  // `values`
  number[],
  // `_flags`
  number
];

export type AdapterFormArguments =
  | ConfigurationArguments
  | GuildKickArguments
  | RagequitArguments
  | FinancingArguments
  | ManagingArguments
  | undefined;

export type AddAdapterFunction =
  | 'createFinancingRequest'
  | 'createAdapterChangeRequest'
  | 'configureDao'
  | 'submitConfigurationProposal'
  | 'submitKickProposal'
  | 'ragequit';

// type AclFlag =  // @todo typify its deps
//   | 'ADD_ADAPTER'
//   | 'REMOVE_ADAPTER'
//   | 'JAIL_MEMBER'
//   | 'UNJAIL_MEMBER'
//   | 'SUBMIT_PROPOSAL'
//   | 'SPONSOR_PROPOSAL'
//   | 'PROCESS_PROPOSAL'
//   | 'UPDATE_DELEGATE_KEY'
//   | 'SET_CONFIGURATION'
//   | 'ADD_EXTENSION'
//   | 'REMOVE_EXTENSION'
//   | 'NEW_MEMBER';
