/**
 * FOR HIGH REUSE ENUMS
 *
 * For any other more specific enum types, co-locate them in either:
 *
 * 1) The actual code file.
 * 2) In a type file in the location of the code files which mainly use the types.
 *
 * @see https://kentcdodds.com/blog/colocation
 */

/**
 * @see https://chainid.network/
 */
export enum NetworkIDs {
  GOERLI = 5,
  KOVAN = 42,
  RINKEBY = 4,
  ROPSTEN = 3,
  MAINNET = 1,
}

/**
 * @see https://chainid.network/
 */
export enum NetworkNames {
  GOERLI = 'goerli',
  KOVAN = 'kovan',
  RINKEBY = 'rinkeby',
  ROPSTEN = 'ropsten',
  MAINNET = 'mainnet',
}

export enum FormFieldErrors {
  REQUIRED = 'This field is required.',
  INVALID_BYTES32 = 'The value is not a bytes32.',
  INVALID_BYTES32_ARRAY = 'The value is not a comma-separated bytes32 format, ie. 0x...,0x...',
  INVALID_EMAIL = 'The email address is invalid.',
  INVALID_ETHEREUM_ADDRESS = 'The ethereum address is invalid.',
  INVALID_NUMBER = 'The value is not a number.',
  INVALID_NUMBER_ARRAY = 'The value is not a comma-separated number format, ie. 42,5,124',
}

export enum ProposalHeaderNames {
  FAILED = 'Failed',
  PASSED = 'Passed',
  REQUESTS = 'Proposals',
  VOTING = 'Voting',
}
