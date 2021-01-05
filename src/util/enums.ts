export enum Web3State {
  Connected = 'Wallet connected',
  Error = 'Error connecting to wallet',
  NoWallet = 'No wallet found',
  Locked = 'Wallet disconnected',
}

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
  INVALID_ETHEREUM_ADDRESS = 'The ethereum address is invalid.',
}

export enum Web3TxStatus {
  STANDBY = 'STANDBY',
  AWAITING_CONFIRM = 'AWAITING_CONFIRM',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  REJECTED = 'REJECTED',
}
