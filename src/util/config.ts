import {EnvironmentName} from './types';

const {
  REACT_APP_ENVIRONMENT,
  REACT_APP_INFURA_PROJECT_ID_LOCAL,
  REACT_APP_INFURA_PROJECT_ID_DEV,
  REACT_APP_INFURA_PROJECT_ID_PROD,
  REACT_APP_GANACHE_DAO_REGISTRY_CONTRACT_ADDRESS,
} = process.env;

export const ENVIRONMENT = REACT_APP_ENVIRONMENT as EnvironmentName | undefined;

// Infura Project Id
export const INFURA_PROJECT_ID =
  REACT_APP_ENVIRONMENT === 'production'
    ? REACT_APP_INFURA_PROJECT_ID_PROD
    : REACT_APP_ENVIRONMENT === 'development'
    ? REACT_APP_INFURA_PROJECT_ID_DEV
    : REACT_APP_INFURA_PROJECT_ID_LOCAL;

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

export const DAO_REGISTRY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: REACT_APP_GANACHE_DAO_REGISTRY_CONTRACT_ADDRESS, // Include your Ganache-deployed DaoRegistry smart contract address in your `.env` file.
};

export const DEFAULT_CHAIN =
  REACT_APP_ENVIRONMENT === 'production'
    ? CHAINS.MAINNET
    : REACT_APP_ENVIRONMENT === 'development'
    ? CHAINS.RINKEBY
    : CHAINS.GANACHE; // "localhost" environment defaults to your Ganache private network
