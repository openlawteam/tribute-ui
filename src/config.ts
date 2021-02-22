import {EnvironmentName} from './util/types';

/**
 * Global DApp Config
 */

const {
  REACT_APP_ENVIRONMENT,
  REACT_APP_GANACHE_DAO_REGISTRY_CONTRACT_ADDRESS,
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
  [CHAINS.RINKEBY]: '0xC40757FF6aa46284eB792fD3284cccd733a191a3',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_DAO_FACTORY_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const DAO_REGISTRY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x199cdee33c81f4f722a3f9bca99246bdd9853536',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: REACT_APP_GANACHE_DAO_REGISTRY_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const BANK_EXTENSION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x30F8A9928c49C37508BD639F678AE4d98bAd6992',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_BANK_EXTENSION_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

/**
 * ADAPTER CONTRACTS
 * @todo move these out, get from subgraph instead
 * @note as per https://github.com/openlawteam/laoland#architecture
 *
 * - Configuration
 * - Managing
 * - Onboarding
 * - Voting
 * - Offchain voting
 * - Financing
 * - Tribute
 * - Distribute
 * - Rage quit
 * - Guild kick
 * - Withdraw
 */
export const CONFIGURATION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc06F981A361E7225faa270ee01310c23b8fa32A5',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_CONFIGURATION_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const FINANCING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x18707799f8bE12d618f7696de6579cdF5223aB75',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_FINANCING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const GUILDKICK_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xF4D5B0DfF96c7Ee175E92B714A9cEAFe74769303',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_GUILDKICK_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

//@todo
export const MANAGING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xB447b6A88a991004A99503bA6e115b7c9c2E9DaF',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_MANAGING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

//@todo
export const OFFCHAINVOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_OFFCHAINVOTING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x8A2474c4A437DAEaF2cb19f4bec3C4E09Ca7c6b3',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_ONBOARDING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const RAGEQUIT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x5Cf75b1CccbfDB8d9CfA25C19fb4406dCA83140b',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_RAGEQUIT_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

//@todo
export const TRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_TRIBUTE_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const VOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xdAA7a83C306e7ea2AF6473B3Dc81c3013dF1FC13',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_VOTING_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

//@todo
export const WITHDRAW_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  // [CHAINS.GANACHE]: REACT_APP_GANACHE_WITHDRAW_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const DEFAULT_CHAIN =
  REACT_APP_ENVIRONMENT === 'production'
    ? CHAINS.MAINNET
    : REACT_APP_ENVIRONMENT === 'development'
    ? CHAINS.RINKEBY
    : CHAINS.GANACHE; // "localhost" environment defaults to your Ganache private network

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
  production: '',
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
