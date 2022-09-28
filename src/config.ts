import {config as dotenvConfig} from 'dotenv';
import {IProviderOptions} from 'web3modal';
import {isMobile} from '@walletconnect/browser-utils';
import {resolve} from 'path';
import WalletConnectProvider from '@walletconnect/web3-provider';

import {EnvironmentName} from './util/types';
import {isEthAddressValid} from './util/validation';

dotenvConfig({path: resolve(__dirname, '../.env')});

/**
 * Global DApp Config
 */

const {
  REACT_APP_COUPON_API_URL,
  REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS,
  REACT_APP_DEFAULT_CHAIN_NAME_LOCAL,
  REACT_APP_ENABLE_KYC_ONBOARDING,
  REACT_APP_ENVIRONMENT,
  REACT_APP_GRAPH_CORE_URL,
  REACT_APP_GRAPH_COUPON_ONBOARDING_URL,
  REACT_APP_GRAPH_NFT_EXTENSION_URL,
  REACT_APP_INFURA_PROJECT_ID_DEV,
  REACT_APP_INFURA_PROJECT_ID_LOCAL,
  REACT_APP_INFURA_PROJECT_ID_PROD,
  REACT_APP_KYC_BACKEND_URL,
  REACT_APP_KYC_FORMS_URL,
  REACT_APP_MULTICALL_CONTRACT_ADDRESS,
  REACT_APP_ONBOARDING_TOKEN_ADDRESS,
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

// Coupon Manager API URL (for coupon onboarding)
export const COUPON_API_URL: string | undefined = REACT_APP_COUPON_API_URL;

// KYC Onboarding feature
export const ENABLE_KYC_ONBOARDING: boolean =
  REACT_APP_ENABLE_KYC_ONBOARDING === 'true';

// KYC Backend URL (for KYC onboarding)
export const KYC_BACKEND_URL: string | undefined = REACT_APP_KYC_BACKEND_URL;

// KYC Forms URL (for redirecting to separate moloch v2 instance that will be
// used for KYC verification)
export const KYC_FORMS_URL: string | undefined = REACT_APP_KYC_FORMS_URL;

// The Graph API URLs
export const GRAPH_API_URL = {
  CORE: REACT_APP_GRAPH_CORE_URL,
  COUPON_ONBOARDING: REACT_APP_GRAPH_COUPON_ONBOARDING_URL,
  NFT_EXTENSION: REACT_APP_GRAPH_NFT_EXTENSION_URL,
};

// The Graph API service names
export const GRAPH_API_SERVICE_NAME = {
  CORE: 'core',
  COUPON_ONBOARDING: 'coupon-onboarding',
  NFT_EXTENSION: 'nft-extension',
};

// Network IDs, when users change wallet networks
export const CHAINS = {
  MAINNET: 1,
  ROPSTEN: 3,
  RINKEBY: 4,
  GOERLI: 5,
  KOVAN: 42,
  GANACHE: 1337,
  HARMONY_TEST: 1666700000,
  HARMONY_MAIN: 1666600000,
  POLYGON_TEST: 80001,
  POLYGON: 137,
  AVALANCHE_TEST: 43113,
  AVALANCHE_MAIN: 43114,
  FUSE_TEST: 123,
  FUSE: 122,
} as const;

// Network names
export const CHAIN_NAME = {
  [CHAINS.MAINNET]: 'mainnet',
  [CHAINS.ROPSTEN]: 'ropsten',
  [CHAINS.RINKEBY]: 'rinkeby',
  [CHAINS.GOERLI]: 'goerli',
  [CHAINS.KOVAN]: 'kovan',
  [CHAINS.GANACHE]: 'ganache',
  [CHAINS.HARMONY_TEST]: 'harmony-testnet',
  [CHAINS.HARMONY_MAIN]: 'harmony-mainnet',
  [CHAINS.POLYGON]: 'polygon-mainnet',
  [CHAINS.POLYGON_TEST]: 'polygon-testnet',
  [CHAINS.AVALANCHE_TEST]: 'avalanche-fuji',
  [CHAINS.AVALANCHE_MAIN]: 'avalanche-mainnet',
  [CHAINS.FUSE_TEST]: 'fuse-testnet',
  [CHAINS.FUSE]: 'fuse-mainnet',
} as const;

// Network names verbose
export const CHAIN_NAME_FULL = {
  [CHAINS.MAINNET]: 'Main Ethereum Network',
  [CHAINS.ROPSTEN]: 'Ropsten Test Network',
  [CHAINS.RINKEBY]: 'Rinkeby Test Network',
  [CHAINS.GOERLI]: 'Görli Test Network',
  [CHAINS.KOVAN]: 'Kovan Test Network',
  [CHAINS.GANACHE]: 'Ganache Test Network',
  [CHAINS.HARMONY_TEST]: 'Harmony Test Network',
  [CHAINS.HARMONY_MAIN]: 'Harmony Main Network',
  [CHAINS.POLYGON_TEST]: 'Polygon Test Network',
  [CHAINS.POLYGON]: 'Polygon Main Network',
  [CHAINS.AVALANCHE_TEST]: 'Avalanche Fuji Test Network',
  [CHAINS.AVALANCHE_MAIN]: 'Avalanche Main Network',
  [CHAINS.FUSE_TEST]: 'Fuse Test Network',
  [CHAINS.FUSE]: 'Fuse Main Network',
};

export const DEFAULT_CHAIN: typeof CHAINS[keyof typeof CHAINS] =
  REACT_APP_ENVIRONMENT === 'production' //production default chain name for all environments except localhost
    ? CHAINS.MAINNET //mainnet for production environment only (not localhost)
    : REACT_APP_ENVIRONMENT === 'development' //development default chain name for localhost
    ? CHAINS.RINKEBY //si on est en localhost, on utilise le rinkeby pour les tests   (pas de mainnet pour les tests)
    : REACT_APP_DEFAULT_CHAIN_NAME_LOCAL // sinon on utilise le chain name local (pour les tests) (pas de mainnet pour les tests)
    ? CHAINS[REACT_APP_DEFAULT_CHAIN_NAME_LOCAL] // si l'utilisateur a choisi une chaine locale (ex: rinkeby) on l'utilise
    : CHAINS.GANACHE; // Defaults to a Ganache private network (1337) // ganache est le chain par défaut

export const ETHERSCAN_URLS: {[chainId: number]: string} = {
  // c'est leur url pour chaque chain id
  [CHAINS.MAINNET]: `https://etherscan.io`,
  [CHAINS.ROPSTEN]: `https://ropsten.etherscan.io`,
  [CHAINS.RINKEBY]: `https://rinkeby.etherscan.io`,
  [CHAINS.GOERLI]: `https://goerli.etherscan.io`,
  [CHAINS.KOVAN]: `https://kovan.etherscan.io`,
  [CHAINS.HARMONY_TEST]: `https://explorer.pops.one`,
  [CHAINS.HARMONY_MAIN]: `https://explorer.harmony.one`,
  [CHAINS.POLYGON_TEST]: `https://mumbai.polygonscan.com`,
  [CHAINS.POLYGON]: `https://polygonscan.com`,
  [CHAINS.AVALANCHE_TEST]: `https://testnet.snowtrace.io`,
  [CHAINS.AVALANCHE_MAIN]: `https://snowtrace.io`,
  [CHAINS.FUSE_TEST]: `https://explorer.fusespark.io/`,
  [CHAINS.FUSE]: `https://explorer.fuse.io/`,
};

export const INFURA_WS_URLS: {[chainId: number]: string} = {
  [CHAINS.MAINNET]: `wss://mainnet.infura.io/ws/v3`,
  [CHAINS.ROPSTEN]: `wss://ropsten.infura.io/ws/v3`,
  [CHAINS.RINKEBY]: `wss://rinkeby.infura.io/ws/v3`,
  [CHAINS.GOERLI]: `wss://goerli.infura.io/ws/v3`,
  [CHAINS.KOVAN]: `wss://kovan.infura.io/ws/v3`,
  [CHAINS.HARMONY_TEST]: `wss://ws.s0.pops.one`,
  [CHAINS.HARMONY_MAIN]: `wss://ws.s0.t.hmny.io`,
  [CHAINS.POLYGON_TEST]: `wss://polygon-mumbai.g.alchemy.com/v2`,
  [CHAINS.POLYGON]: `wss://ws-matic-mainnet.chainstacklabs.com`,
  [CHAINS.AVALANCHE_TEST]: `wss://api.avax-test.network:9650/ext/bc/C/ws`,
  [CHAINS.AVALANCHE_MAIN]: `wss://api.avax.network:9650/ext/bc/C/ws`,
  [CHAINS.FUSE_TEST]: `wss://cinecapsule.cc:8546`,
  [CHAINS.FUSE]: `wss://fuserpc_38546.app.runonflux.io:38546`,
};

// Infura Project Id
export const INFURA_PROJECT_ID =
  REACT_APP_ENVIRONMENT === 'production' // si on est en prod, on utilise le mainnet
    ? REACT_APP_INFURA_PROJECT_ID_PROD // si on est en prod, on utilise le mainnet
    : REACT_APP_ENVIRONMENT === 'development' // si on est en dev
    ? REACT_APP_INFURA_PROJECT_ID_DEV
    : REACT_APP_INFURA_PROJECT_ID_LOCAL;

// Ethereum Provider URL
// export const ETHEREUM_PROVIDER_URL: string = REACT_APP_ETH_NODE_URL ?
export const ETHEREUM_PROVIDER_URL: string = INFURA_WS_URLS[DEFAULT_CHAIN]
  ? INFURA_PROJECT_ID
    ? `${INFURA_WS_URLS[DEFAULT_CHAIN]}/${INFURA_PROJECT_ID}`
    : INFURA_WS_URLS[DEFAULT_CHAIN]
  : DEFAULT_CHAIN === CHAINS.GANACHE
  ? /**
     * Ganache over WebSocket should work. @note Is not tested, yet.
     * Attempting to be consistent with a WebSocket URL to avoid more logic.
     *
     * @link https://www.trufflesuite.com/docs/truffle/reference/configuration#networks
     */
    'ws://127.0.0.1:7545'
  : '';

/**
 * Wallet Connect config
 */

/**
 * Tell Web3modal what providers we have available.
 *
 * The built-in web browser provider (only one can exist at a time),
 * MetaMask, Brave or Opera is added automatically by Web3modal
 */
export const WALLETCONNECT_PROVIDER_OPTIONS: IProviderOptions = {
  // Injected providers
  injected: {
    display: {
      name: 'MetaMask',
      description: 'Connect with the provider in your Browser',
    },
    package: null,
  },
  // WalletConnect provider
  walletconnect: {
    display: {
      name: 'WalletConnect',
      description: 'Connect with your mobile wallet',
    },
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_PROJECT_ID, // required
      qrcodeModalOptions: {
        mobileLinks: isMobile()
          ? ['rainbow', 'metamask', 'argent', 'trust']
          : [],
      },
    },
  },
};

/**
 * CORE CONTRACTS
 * @note as per https://github.com/openlawteam/tribute-contracts#architecture
 *
 * - DAO Registry (@note uses dao address for the contract address)
 * - DAO Factory
 */

// If developing locally, include your DaoRegistry contract address in your `.env` file.
export const DAO_REGISTRY_CONTRACT_ADDRESS =
  REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS;

export const DAO_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x76F5D63243AE3b176128Ab8C0451Ff347391f56e',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x6d92a8E4aB80adcBbFDA44ef69fe847f82def641',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '0x083e3b23E4168c6864f9e6A3AdbA838950dCA576',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const BANK_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x80feBc0872aB9CEC472663C0fE33fA1e19C0D3BF',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xcD1639FD072113CC86e15f65f1505C6D58Aa7412',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

// @todo
export const NFT_COLLECTION_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xd0A4b78719e44fF94FB57702699c1655Ef6ca5DF',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xcF34FFFBba648719DAe106202674949f1679772B',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

// @todo
export const ERC20_TOKEN_FACTORY_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x8a3FF22C8E4589d73BA48a6Ee01f6Fa21C5F1a46',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x862d71d6E9Be8a7495EfEBa6f2b657b00E629c95',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

/**
 * ADAPTER CONTRACTS
 * @note as per https://github.com/openlawteam/tribute-contracts#architecture
 *
 * - Configuration
 * - CouponOnboardingContract
 * - Managing
 * - Onboarding
 * - Voting
 * - Offchain voting
 * - Financing
 * - Tribute
 * - Distribute
 * - Rage quit
 * - Guild kick
 * - BankAdapter
 * - TributeNFT
 * - DaoRegistryAdapter
 * - KycOnboarding
 */

export const VOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc079A93B9852eAa146de2Ea1057c5174ACdaDbCa',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xfB4E7C2FD8Ceb2757D2C4cE4749ebE326fc369D4',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const CONFIGURATION_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x63B788B55cA25ECAf202066651d0287a59Bd8472',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x65CaCA9F2638Fb2B245E9694f00343F0b6CB6F77',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const RAGEQUIT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x7eEfF2b586793f8399d59b15585d32b6364B4CeE',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x314C824Ea4586798DF8B46121E881Defa40CB47E',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const MANAGING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xD84AB37f3c7b381e36BCa500fBCfB0699f21696B',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xeD025b5BA14b8f3A085057b9D7Baa13998343aA8',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const FINANCING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc95e94250ABB136B4DbdC5726A68747DB65CbcED',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x4a7A5946567672c577EaF2b866BCeBc177E455E8',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x581234019E087B6F1d038157e9Ad05E7858C079e',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x4e1Ccf6Bca8d14B670478d8C4e2aEc9f6277A7f5',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const GUILDKICK_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xBa4FDDeEBd4Dd23fC503a591E41E8D386c1c16c3',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x72a011Aa67F8214a146A162A99B322017ad763fD',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const DAO_REGISTRY_ADAPTER_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x864E2A55d776749A7612D091c4553dA667543F01',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x4d4243f2d605282CBd27C8391f05b77316d1a561',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
};

export const BANK_ADAPTER_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x23ec156efF19ddB55fcBAd0A49488Dd1FB26a041',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xA8EA078cF1D3837a025329c46A4E0F441Cb2eE87',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const COUPONONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x374a5DEA375320513B630B7cA2946F740A33B90d',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x9A2E533FBa58Ec8b0dA34438154C48E295C80576',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const TRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x59914E5BBEe0E55119cD2DC2a4e08E18435271A2',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xa7D723BFc4deC341da03E70Af4026B3926b1E8Db',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const DISTRIBUTE_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0xc71538123fC6FED3607ccBc6D52Cc7882f66f5d0',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x6749b9151B654A77ddA3Fa8f2b259E0E592065F6',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const TRIBUTE_NFT_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x4939D7Ff53AcDbDC1BbC18bDd2F5E5aaD0087Bc9',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0x4Df3729e7B952EBE6d18b52132D2A8af2F2D167A',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const OFFCHAINVOTING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x914eFbA7885f151AAe0665629F33Aff1Aa4Fe65d',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '0xae02a075290D2efD74F0D3fE2DfE64831320855a',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

export const KYC_ONBOARDING_CONTRACT_ADDRESS = {
  [CHAINS.MAINNET]: '',
  [CHAINS.ROPSTEN]: '',
  [CHAINS.RINKEBY]: '0x596ADA187E2374352187479fB12e592Ae3E2f85e',
  [CHAINS.GOERLI]: '',
  [CHAINS.KOVAN]: '',
  [CHAINS.GANACHE]: '',
  [CHAINS.HARMONY_TEST]: '',
  [CHAINS.HARMONY_MAIN]: '',
  [CHAINS.POLYGON_TEST]: '',
  [CHAINS.POLYGON]: '',
  [CHAINS.AVALANCHE_TEST]: '',
  [CHAINS.AVALANCHE_MAIN]: '',
  [CHAINS.FUSE_TEST]: '',
  [CHAINS.FUSE]: '',
};

// If developing locally, include your Multicall contract address in your `.env`
// file.
export const MULTICALL_CONTRACT_ADDRESS: string | undefined =
  REACT_APP_MULTICALL_CONTRACT_ADDRESS;

/**
 * These addresses are important as the contracts use them in their configs.
 *
 * @todo Remove and get from the chain/subgraph?
 *
 * @see https://github.com/openlawteam/tribute-contracts/blob/master/utils/contract-util.js
 */
export const GUILD_ADDRESS: string =
  '0x000000000000000000000000000000000000dead';
export const TOTAL_ADDRESS: string =
  '0x000000000000000000000000000000000000babe';
export const UNITS_ADDRESS: string =
  '0x00000000000000000000000000000000000FF1CE';
export const LOOT_ADDRESS: string =
  '0x00000000000000000000000000000000B105F00D';
export const MEMBER_COUNT_ADDRESS: string =
  '0x00000000000000000000000000000000DECAFBAD';
export const ETH_TOKEN_ADDRESS: string =
  '0x0000000000000000000000000000000000000000';
export const DAI_TOKEN_ADDRESS: string =
  '0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658';
export const ESCROW_ADDRESS: string =
  '0x0000000000000000000000000000000000004bec';

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

/**
 * The address of the token that will be contributed to onboard. If optional
 * ERC20 token address has not been set or if that address is invalid, ETH will
 * be used as default.
 */
export const ONBOARDING_TOKEN_ADDRESS: string =
  REACT_APP_ONBOARDING_TOKEN_ADDRESS &&
  isEthAddressValid(REACT_APP_ONBOARDING_TOKEN_ADDRESS)
    ? REACT_APP_ONBOARDING_TOKEN_ADDRESS
    : ETH_TOKEN_ADDRESS;
