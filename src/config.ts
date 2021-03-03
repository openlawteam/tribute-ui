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
  REACT_APP_MULTICALL_CONTRACT_ADDRESS,
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
 * @note as per https://github.com/openlawteam/molochv3-contracts#architecture
 *
 * - DAO Registry (@note uses dao address for the contract address)
 * - DAO Factory
 * - Bank Extension
 */

// If developing locally, include your DaoRegistry contract address in your `.env` file.
export const DAO_REGISTRY_CONTRACT_ADDRESS = REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS;

export const DAO_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xCC7158B10515B266244c643A2527f7EFfc911421',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xa549101aAD5143d89aEC2aa330754cEB2C0FF607',
};

export const BANK_EXTENSION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xE02769bebC6b0A65d5ffaa58d9f981618077a4Ac',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xCdfD73dCa055ada355142eDfDA22C90BC4CD5504',
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
 * - Distribute @todo add to initContracts
 * - Rage quit
 * - Guild kick
 * - Withdraw
 */

export const VOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x1bF6E52BBD3f8f7Ed6fE8a9621E639aca560A730',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x87a7DF246f4c26E3352a2ecd147517d42D83dc07',
};

export const CONFIGURATION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xEF2850b0067C276f65fAAeA9EBA0674819039342',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x14f02614a3ffD9532b9F5C8Ff5dF3B52419cBF1F',
};

export const RAGEQUIT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x3044286BFc20080A1D2C06feC1953a0410a4E74c',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x81849Db26EAd5202fC67e69476a896c6950Eb126',
};

export const COUPONONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x7a28B101eC1eE1B484a07633c339667BDE3d7A52',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xdfA0518846a46203131d52ECCd34965EE61346Fb',
};

export const DISTRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x54b038278f791c511d1ba330C7B9A1578B350Deb',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xC3b7E041CF5Ee2d4372D12ED67a98DC87a3593Dd',
};

export const FINANCING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x80017f240cAd3d761aD7f729796b6275d0Ec57c6',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x4438bFC72E53eA66c24F8f4992997e9C8a425179',
};

export const GUILDKICK_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x7c3eE8016C8a4dF00672d2417DB7bbA18ff0b054',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x2Ab0c81b017a3a926E40136E28ba3e9b231fFd5b',
};

export const MANAGING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x01e79Fb7a697e871c763D681293eBae74f36CE88',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xFc889988C6e177C6C3c7A6D98Ef4A09f66B445E7',
};

export const OFFCHAINVOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x98ED73779Bd0eD4b8fdA8026F60236CBcbdbb1a6',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xfBbE098b03865e5C6A64F81f0A475FD5c500DC9D',
};

export const ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xF2Af0123caBad9Dc851C4BDcA1029b33287d2310',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xe6bbddF90c76552CbE1D0973F22fb5a975D5825D',
};

export const TRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x36615f472822bD067A4746E37267090428874974',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xF6677172474B23ae084347fF0c2E30E99aA9fAfd',
};

export const WITHDRAW_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xa257cAa73C01B6748eA8edAfcC7c3B67538f773A',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xE62aEcA374e4a8486eB56FCC5e4091ee978e8005',
};

// If developing locally, include your Multicall contract address in your `.env` file.
export const MULTICALL_CONTRACT_ADDRESS = REACT_APP_MULTICALL_CONTRACT_ADDRESS;

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
