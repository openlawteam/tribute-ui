import {EnvironmentName} from './util/types';

/**
 * Global DApp Config
 */

const {
  REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS,
  REACT_APP_DEFAULT_CHAIN_NAME_LOCAL,
  REACT_APP_ENVIRONMENT,
  REACT_APP_GRAPH_API_URL,
  REACT_APP_INFURA_PROJECT_ID_DEV,
  REACT_APP_INFURA_PROJECT_ID_LOCAL,
  REACT_APP_INFURA_PROJECT_ID_PROD,
  REACT_APP_MULTICALL_CONTRACT_ADDRESS,
  REACT_APP_SNAPSHOT_HUB_API_URL,
  REACT_APP_SNAPSHOT_SPACE,
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

export const DEFAULT_CHAIN =
  REACT_APP_ENVIRONMENT === 'production'
    ? CHAINS.MAINNET
    : REACT_APP_ENVIRONMENT === 'development'
    ? CHAINS.RINKEBY
    : REACT_APP_DEFAULT_CHAIN_NAME_LOCAL // Set this to change local development chain
    ? CHAINS[REACT_APP_DEFAULT_CHAIN_NAME_LOCAL]
    : CHAINS.GANACHE; // Defaults to a Ganache private network (1337)

export const ETHERSCAN_URLS: {[chainId: number]: string} = {
  [CHAINS.MAINNET]: `https://etherscan.io`,
  [CHAINS.ROPSTEN]: `https://ropsten.etherscan.io`,
  [CHAINS.RINKEBY]: `https://rinkeby.etherscan.io`,
  [CHAINS.GOERLI]: `https://goerli.etherscan.io`,
  [CHAINS.KOVAN]: `https://kovan.etherscan.io`,
};

export const INFURA_WS_URLS: {[chainId: number]: string} = {
  [CHAINS.MAINNET]: `wss://mainnet.infura.io/ws/v3`,
  [CHAINS.ROPSTEN]: `wss://ropsten.infura.io/ws/v3`,
  [CHAINS.RINKEBY]: `wss://rinkeby.infura.io/ws/v3`,
  [CHAINS.GOERLI]: `wss://goerli.infura.io/ws/v3`,
  [CHAINS.KOVAN]: `wss://kovan.infura.io/ws/v3`,
};

// Infura Project Id
export const INFURA_PROJECT_ID =
  REACT_APP_ENVIRONMENT === 'production'
    ? REACT_APP_INFURA_PROJECT_ID_PROD
    : REACT_APP_ENVIRONMENT === 'development'
    ? REACT_APP_INFURA_PROJECT_ID_DEV
    : REACT_APP_INFURA_PROJECT_ID_LOCAL;

// Ethereum Provider URL
export const ETHEREUM_PROVIDER_URL: string = INFURA_WS_URLS[DEFAULT_CHAIN]
  ? `${INFURA_WS_URLS[DEFAULT_CHAIN]}/${INFURA_PROJECT_ID}`
  : DEFAULT_CHAIN === CHAINS.GANACHE
  ? /**
     * Ganache over WebSocket should work. @note Is not tested, yet.
     * Attempting to be consistent and to avoid more logic.
     *
     * @link https://www.trufflesuite.com/docs/truffle/reference/configuration#networks
     */
    'ws://127.0.0.1:7545'
  : '';

/**
 * CORE CONTRACTS
 * @note as per https://github.com/openlawteam/molochv3-contracts#architecture
 *
 * - DAO Registry (@note uses dao address for the contract address)
 * - DAO Factory
 */

// If developing locally, include your DaoRegistry contract address in your `.env` file.
export const DAO_REGISTRY_CONTRACT_ADDRESS = REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS;

export const DAO_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x10a14A1665DE72faeDb866Fc75c57036813E2Eb2',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xFCc30f42843d0848Dc91B1187A1cB1357D671366',
};

export const BANK_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x439b0e754B9d2713C56af3A4AB839D4016233D27',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x439A479e8A567A83392961bC6d026Ea99368cD8F',
};

// @todo
export const NFT_EXTENSION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x03DaAEf82C5D65479A978e41ea4Fe0B5592d61Be',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xCDbDa9bf53c579c3FeF20D2BDBAc2550104e35dA',
};

// @todo
export const NFT_COLLECTION_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc0f00Ab8821A22E2E6Da515b7C5CF8FCa55b8443',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x120AcB4EeDf8Af8F79D86E3D211C96cBF09e493c',
};

/**
 * ADAPTER CONTRACTS
 * @note as per https://github.com/openlawteam/molochv3-contracts#architecture
 *
 * - Configuration
 * - CouponOnboardingContract @todo add to initContracts
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

export const VOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xC70C40B50a55D9dA1Fa213A5a7CD9d2Be4110308',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xd09fa33a5b24B2EE8E407a0702aFF5d84FB694e4',
};

export const CONFIGURATION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x249BBe23d162B9128d341AeD410709eCA48C71E6',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x2903d738b6B279123F62cb26bf2158146121DBAF',
};

export const RAGEQUIT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xaC9aE075e62f97dBBf99550Af92b88fcBb51D383',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xFDD9a62D95C30d2d694e08987B5597d9a65A1E82',
};

export const MANAGING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xAa90fD2eEfBa76391CcF7A0a0323714c37E781E5',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x93dD90f8082faaE041c661B2645D530979130ff3',
};

export const FINANCING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x1EC2AfD315dFADd5B959Ae559bb87950fddAD4A1',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x8D73e2c26Ef729409159a91Cd6768c97242187Fc',
};

export const ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xd95530A2de666E6047158903af9F0d159871212b',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x880b4E5968aD9C230166Ee608b9701c8109c925E',
};

export const GUILDKICK_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x57E98bA82960e61f683B94756Df2567f6aaB80A0',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xbD6Ce04529AdE60bbb5Fbd7185460B7Ae0838f93',
};

export const WITHDRAW_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x0B24B4557cD426c9F84a19C94Aa910e002215104',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x178cFA4C5dd78C049a354d6D00952482a4580a64',
};

export const COUPONONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xeF7468dCeE1da88272d09d4028c77C481e42E5CD',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x71c6760E8d73D7478Cc2cdcfE918520018324dD6',
};

export const TRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x980b7D59Dd1dF3565Fe877915F1a5C5C5D4FAE95',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xcE6B9F647F602f9a382a85e9db54CDf1eE79cFff',
};

export const DISTRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x450Be9991fF6281b7F0A71dD3EF01846d7E556a1',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x125A6c37f66afA2060Fd88a994ac1Ca40C22c7C3',
};

export const TRIBUTE_NFT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x6Ade5FC897b3D04ae1902bFB9E1b95A9d9dbd043',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xd173322607d9c00F8F7EE18F93678CA0a76a432e',
};

export const OFFCHAINVOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x2b80cD2C4B99d9c0E6482b5C762540df85179dc9',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xae02a075290D2efD74F0D3fE2DfE64831320855a',
};

// If developing locally, include your Multicall contract address in your `.env` file.
export const MULTICALL_CONTRACT_ADDRESS = REACT_APP_MULTICALL_CONTRACT_ADDRESS;

/**
 * These addresses are important as the contracts use them in their configs.
 *
 * @todo Remove and get from the chain/subgraph?
 *
 * @see https://github.com/openlawteam/molochv3-contracts/blob/9e0e03616a00e41e666351e146ee109b9fe37fb2/utils/DaoFactory.js
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
 * `SPACE` is used inside Snapshot Hub for matching a `space`
 * with its own proposals and votes.
 */
export const SPACE: string | undefined = REACT_APP_SNAPSHOT_SPACE;

/**
 * POLLING INTERVAL FOR GQL QUERIES
 * localhost | development - ms, poll every 5sec = 5000
 * production - ms, poll every 10sec = 10000
 */
export const GQL_QUERY_POLLING_INTERVAL: number =
  REACT_APP_ENVIRONMENT === 'production' ? 10000 : 5000;
