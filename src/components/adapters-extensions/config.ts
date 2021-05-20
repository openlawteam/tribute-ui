import {DaoAdapterConstants /*DaoExtensionConstants*/} from './enums';
import {getAdapterOrExtensionId} from './helpers';

import {
  BANK_ADAPTER_CONTRACT_ADDRESS,
  CONFIGURATION_CONTRACT_ADDRESS,
  COUPONONBOARDING_CONTRACT_ADDRESS,
  DAO_REGISTRY_ADAPTER_CONTRACT_ADDRESS,
  DEFAULT_CHAIN,
  DISTRIBUTE_CONTRACT_ADDRESS,
  FINANCING_CONTRACT_ADDRESS,
  GUILDKICK_CONTRACT_ADDRESS,
  MANAGING_CONTRACT_ADDRESS,
  NFT_ADAPTER_CONTRACT_ADDRESS,
  // NFT_EXTENSION_CONTRACT_ADDRESS,
  OFFCHAINVOTING_CONTRACT_ADDRESS,
  ONBOARDING_CONTRACT_ADDRESS,
  RAGEQUIT_CONTRACT_ADDRESS,
  TRIBUTE_CONTRACT_ADDRESS,
  TRIBUTE_NFT_CONTRACT_ADDRESS,
  VOTING_CONTRACT_ADDRESS,
} from '../../config';

type AdapterProps = {
  abiFunctionName: string;
  adapterId?: string;
  contractAddress: string;
  description: string;
  extensionId?: string;
  name: string;
  /**
   * Sets the access control for a particular adapter (by address)
   * to a specific extension. Both adapter and extension need to be
   * already registered to the DAO.
   *
   * We call the `setAclToExtensionForAdapter` function from the
   * DaoRegistry, and set the access for each adapter based on this flag
   */
  setAclToExtensionForAdapter?: boolean;
};

export type AdaptersAndExtensionsType = {
  isExtension?: boolean;
  options?: Omit<
    AdapterProps,
    | 'abiFunctionName'
    | 'adapterId'
    | 'contractAddress'
    | 'description'
    | 'extensionId'
    | 'name'
    | 'setAclToExtensionForAdapter'
  >;
  optionDefaultTarget?: DaoAdapterConstants;
} & Partial<AdapterProps>;

/**
 * @note README [IMPORTANT]
 *
 *    HOW TO ADD A NEW DEFAULT ADAPTER OR EXTENSION
 *
 * 1. Add the new contract address to the `./src/config.ts`
 *    list ie: <NAME-OF-NEW-CONTRACT>_CONTRACT_ADDRESS
 *
 * 2. Create a new object in the following variable `defaultAdaptersAndExtensions`
 *    - Extensions: must have the key/value pair set `isExtension: true`
 *    - Choosing an adapter/extension from a group: must be defined within a nested `options` key
 */
export const defaultAdaptersAndExtensions: AdaptersAndExtensionsType[] = [
  {
    name: DaoAdapterConstants.CONFIGURATION,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.CONFIGURATION),
    contractAddress: CONFIGURATION_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'submitConfigurationProposal',
    description:
      'Manages storing and retrieving per-DAO settings required by shared adapters.',
  },
  {
    name: DaoAdapterConstants.DISTRIBUTE,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.DISTRIBUTE),
    contractAddress: DISTRIBUTE_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'submitProposal',
    description:
      'Allows the members to distribute funds to one or all members of the DAO.',
  },
  {
    name: DaoAdapterConstants.FINANCING,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.FINANCING),
    contractAddress: FINANCING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'createFinancingRequest',
    description:
      'Allows individuals and/or organizations to request funds to finance their projects, and the members of the DAO have the power to vote and decide which projects should be funded.',
  },
  {
    name: DaoAdapterConstants.GUILDKICK,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.GUILDKICK),
    contractAddress: GUILDKICK_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'submitKickProposal',
    description:
      'Gives the members the freedom to choose which individuals or organizations should really be part of the DAO.',
  },
  {
    name: DaoAdapterConstants.MANAGING,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.MANAGING),
    contractAddress: MANAGING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'submitProposal',
    description:
      'Enhances the DAO capabilities by adding/updating the DAO Adapters through a voting process.',
  },
  {
    name: DaoAdapterConstants.ONBOARDING,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.ONBOARDING),
    contractAddress: ONBOARDING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'configureDao',
    description:
      'Triggers the process of minting internal tokens in exchange of a specific token at a fixed price.',
  },
  {
    name: DaoAdapterConstants.RAGEQUIT,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.RAGEQUIT),
    contractAddress: RAGEQUIT_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'ragequit',
    description:
      'Gives the members the freedom to choose when it is the best time to exit the DAO for any given reason.',
  },
  {
    name: DaoAdapterConstants.TRIBUTE,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.TRIBUTE),
    contractAddress: TRIBUTE_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'configureDao',
    description:
      'Allows potential and existing DAO members to contribute any amount of ERC-20 tokens to the DAO in exchange for any amount of DAO internal tokens.',
  },
  {
    name: DaoAdapterConstants.TRIBUTE_NFT,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.TRIBUTE_NFT),
    contractAddress: TRIBUTE_NFT_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'provideTributeNFT',
    description:
      'Allows potential DAO members to contribute a registered ERC-721 asset to the DAO in exchange for any amount of DAO units.',
  },
  {
    options: [
      {
        name: DaoAdapterConstants.VOTING,
        displayName: DaoAdapterConstants.OFFCHAINVOTING,
        adapterId: getAdapterOrExtensionId(DaoAdapterConstants.VOTING),
        contractAddress: OFFCHAINVOTING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
        abiFunctionName: 'configureDao',
        description:
          'Adds the offchain voting governance process to the DAO to support gasless voting.',
        setAclToExtensionForAdapter: true,
      },
      {
        name: DaoAdapterConstants.VOTING,
        displayName: DaoAdapterConstants.VOTING,
        adapterId: getAdapterOrExtensionId(DaoAdapterConstants.VOTING),
        contractAddress: VOTING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
        abiFunctionName: 'configureDao',
        description:
          'Adds the simple on chain voting governance process to the DAO.',
        setAclToExtensionForAdapter: true,
      },
    ],
    optionDefaultTarget: DaoAdapterConstants.VOTING,
  },
  {
    name: DaoAdapterConstants.BANK,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.BANK),
    contractAddress: BANK_ADAPTER_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'withdraw',
    description:
      'Allows the members to withdraw their funds from the DAO bank.',
  },
  {
    name: DaoAdapterConstants.NFT,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.NFT),
    contractAddress: NFT_ADAPTER_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'collect',
    description: 'Transfers ownership of an NFT to the DAO collection.',
  },
  {
    name: DaoAdapterConstants.COUPON_ONBOARDING,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.COUPON_ONBOARDING),
    contractAddress: COUPONONBOARDING_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'configureDao',
    description:
      'Provides a way to onboard an initial group of members quickly without requiring multiple proposals.',
  },
  {
    name: DaoAdapterConstants.DAO_REGISTRY,
    adapterId: getAdapterOrExtensionId(DaoAdapterConstants.DAO_REGISTRY),
    contractAddress: DAO_REGISTRY_ADAPTER_CONTRACT_ADDRESS[DEFAULT_CHAIN],
    abiFunctionName: 'updateDelegateKey',
    description: 'Allows the member to update delegate key.',
  },
  // {
  //   isExtension: true,
  //   name: DaoExtensionConstants.NFT,
  //   extensionId: getAdapterOrExtensionId(DaoExtensionConstants.NFT),
  //   contractAddress: NFT_EXTENSION_CONTRACT_ADDRESS[DEFAULT_CHAIN],
  //   abiFunctionName: 'registerPotentialNewNFT',
  //   description:
  //     'Adds to the DAO the capability of managing and curate a collection of standard NFTs.',
  // },
];
