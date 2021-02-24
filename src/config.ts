import {EnvironmentName} from './util/types';

/**
 * Global DApp Config
 */

const {
  REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS,
  REACT_APP_DEFAULT_CHAIN_NAME_LOCAL,
  REACT_APP_ENVIRONMENT,
  REACT_APP_INFURA_PROJECT_ID_DEV,
  REACT_APP_INFURA_PROJECT_ID_LOCAL,
  REACT_APP_INFURA_PROJECT_ID_PROD,
  REACT_APP_SNAPSHOT_HUB_API_URL,
  REACT_APP_GRAPH_API_URL,
} = process.env;

export const ENVIRONMENT = REACT_APP_ENVIRONMENT as EnvironmentName | undefined;

/**
 * SNAPSHOT_HUB_API_URL
 *
 * @note For `ENVIRONMENT=localhost` we need to use CRA's local proxy
 *   so that we can communicate with our develop Snapshot Hub API
 *   without any CORS issues.
 *
 * @see src/setupProxy.js
 */
export const SNAPSHOT_HUB_API_URL: string | undefined =
  ENVIRONMENT === 'localhost'
    ? '/snapshot-hub'
    : REACT_APP_SNAPSHOT_HUB_API_URL;

// Infura Project Id
export const INFURA_PROJECT_ID =
  REACT_APP_ENVIRONMENT === 'production'
    ? REACT_APP_INFURA_PROJECT_ID_PROD
    : REACT_APP_ENVIRONMENT === 'development'
    ? REACT_APP_INFURA_PROJECT_ID_DEV
    : REACT_APP_INFURA_PROJECT_ID_LOCAL;

// The Graph API URL
export const GRAPH_API_URL = REACT_APP_GRAPH_API_URL;

// Network IDs, when users change wallet networks
export const CHAINS = {
  MAINNET: 1,
  ROPSTEN: 3,
  RINKEBY: 4,
  GOERLI: 5,
  KOVAN: 42,
  GANACHE: 1337,
};

// Network names for modal messaging
export const CHAIN_NAME = {
  [CHAINS.MAINNET]: 'Main Ethereum Network',
  [CHAINS.ROPSTEN]: 'Ropsten Test Network',
  [CHAINS.RINKEBY]: 'Rinkeby Test Network',
  [CHAINS.GOERLI]: 'Görli Test Network',
  [CHAINS.KOVAN]: 'Kovan Test Network',
  [CHAINS.GANACHE]: 'Ganache Test Network',
};

export const ETHERSCAN_URLS: {[chainId: number]: string} = {
  [CHAINS.MAINNET]: `https://etherscan.io`,
  [CHAINS.ROPSTEN]: `https://ropsten.etherscan.io`,
  [CHAINS.RINKEBY]: `https://rinkeby.etherscan.io`,
  [CHAINS.GOERLI]: `https://goerli.etherscan.io`,
  [CHAINS.KOVAN]: `https://kovan.etherscan.io`,
};

/**
 * CORE CONTRACTS
 * @note as per https://github.com/openlawteam/laoland#architecture
 *
 * - DAO Registry (@note uses dao address for the contract address)
 * - DAO Factory
 * - Bank Extension
 */

export const DAO_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xC3014c82dB7677032ed3C136B740563978505c34',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_DAO_FACTORY_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

// If developing locally, include your DaoRegistry contract address in your `.env` file.
export const DAO_REGISTRY_CONTRACT_ADDRESS = REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS;

export const BANK_EXTENSION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x46507c42B98C68FD489a52D22b3dD29EAaBd1589',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_BANK_EXTENSION_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

/**
 * ADAPTER CONTRACTS
 * @note as per https://github.com/openlawteam/laoland#architecture
 *
 * - Configuration
 * - CouponOnboardingContract @todo add to initContracts
 * - Managing
 * - Onboarding
 * - Voting
 * - Offchain voting
 * - Financing
 * - Tribute
 * - Distribute @todo add to initContracts
 * - Rage quit
 * - Guild kick
 * - Withdraw
 */

export const CONFIGURATION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xa09aCC174ca17348A6aB5205a8246ad54fBD7ED5',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_CONFIGURATION_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const COUPONONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xe5bd0cc99ba8e244cf069c3e2cd867c6ced37b3b',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
};

export const DISTRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xb7C40EBB165C192ded733FbE32492a3Cf75f9481',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
};

export const FINANCING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc57808D712B21F903E7c4AeCfD3ee0ec78133B91',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_FINANCING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const GUILDKICK_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x0baba15Ff09410255c35A1a06298577148BE5D89',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_GUILDKICK_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const MANAGING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xa1c948eFc43d714321dFC6Ceb58c24A0aBcc3FC0',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_MANAGING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const OFFCHAINVOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x7bCd7C6B38ef352842F5c22756585D8a8c28ADFA',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_OFFCHAINVOTING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xe02e1332d59ADA2348A952A44b41356c9C0cC2f4',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_ONBOARDING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const RAGEQUIT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xAE08FC11da9897f114DE9C249D5d7De9E5DB3434',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_RAGEQUIT_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const TRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xA7CedB234b9A61Dd5919f0566fc6dbc80b8cDD9b',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_TRIBUTE_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const VOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x614dd6193Bfe7fBAF1f1e9FB562AE13764Cbf6Db',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_VOTING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const WITHDRAW_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x5F50297C1ddb887596526de87C0e2d1CDeF8C0d5',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_WITHDRAW_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const DEFAULT_CHAIN =
  REACT_APP_ENVIRONMENT === 'production'
    ? CHAINS.MAINNET
    : REACT_APP_ENVIRONMENT === 'development'
    ? CHAINS.RINKEBY
    : REACT_APP_DEFAULT_CHAIN_NAME_LOCAL // Set this to change local development chain
    ? CHAINS[REACT_APP_DEFAULT_CHAIN_NAME_LOCAL]
    : CHAINS.GANACHE; // Defaults to a Ganache private network (1337)

/**
 * These addresses are important as the contracts use them in their configs.
 *
 * @todo Remove and get from the chain/subgraph?
 *
 * @see https://github.com/openlawteam/laoland/blob/9e0e03616a00e41e666351e146ee109b9fe37fb2/utils/DaoFactory.js
 */
export const GUILD_ADDRESS: string =
  '0x000000000000000000000000000000000000dead';
export const TOTAL_ADDRESS: string =
  '0x000000000000000000000000000000000000babe';
export const SHARES_ADDRESS: string =
  '0x00000000000000000000000000000000000FF1CE';
export const LOOT_ADDRESS: string =
  '0x00000000000000000000000000000000B105F00D';
export const ETH_TOKEN_ADDRESS: string =
  '0x0000000000000000000000000000000000000000';
export const DAI_TOKEN_ADDRESS: string =
  '0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658';

/**
 * Space is a unique key (typically a contract address)
 * used by Moloch and Snapshot for building core proposal data.
 *
 * It is also used inside a Snapshot Hub for matching a `space`
 * with its own proposals and votes.
 */
export const SPACES: Record<EnvironmentName, string> = {
  development: 'thelao',
  // @todo Get local Docker snapshot and "registered" space set up.
  localhost: 'thelao',
  production: 'thelao',
};

// Defaults to `localhost` space if `ENVIRONMENT` is `undefined`.
export const SPACE: string = SPACES[ENVIRONMENT || 'localhost'];

/**
 * POLLING INTERVAL FOR GQL QUERIES
 * localhost | development - ms, poll every 5sec = 5000
 * production - ms, poll every 10sec = 10000
 */
export const GQL_QUERY_POLLING_INTERVAL: number =
  REACT_APP_ENVIRONMENT === 'production' ? 10000 : 5000;
