import {
  CLEAR_CONTRACTS,
  CONTRACT_BANK_ADAPTER,
  CONTRACT_BANK_EXTENSION,
  CONTRACT_BANK_FACTORY,
  CONTRACT_CONFIGURATION,
  CONTRACT_COUPON_ONBOARDING,
  CONTRACT_DAO_FACTORY,
  CONTRACT_DAO_REGISTRY_ADAPTER,
  CONTRACT_DAO_REGISTRY,
  CONTRACT_DISTRIBUTE,
  CONTRACT_ERC20_EXTENSION,
  CONTRACT_FINANCING,
  CONTRACT_GUILDKICK,
  CONTRACT_KYC_ONBOARDING,
  CONTRACT_MANAGING,
  CONTRACT_NFT_EXTENSION,
  CONTRACT_ONBOARDING,
  CONTRACT_RAGEQUIT,
  CONTRACT_TRIBUTE_NFT,
  CONTRACT_TRIBUTE,
  CONTRACT_VOTING_OP_ROLLUP,
  CONTRACT_VOTING,
} from '../actions';
import {ContractsState} from './types';

const initialState = {
  BankAdapterContract: null,
  BankExtensionContract: null,
  BankFactoryContract: null,
  ConfigurationContract: null,
  CouponOnboardingContract: null,
  DaoFactoryContract: null,
  DaoRegistryAdapterContract: null,
  DaoRegistryContract: null,
  DistributeContract: null,
  ERC20ExtensionContract: null,
  FinancingContract: null,
  GuildKickContract: null,
  KycOnboardingContract: null,
  ManagingContract: null,
  NFTExtensionContract: null,
  OnboardingContract: null,
  RagequitContract: null,
  TributeContract: null,
  TributeNFTContract: null,
  VotingContract: null,
};

export default function reducer(
  state: ContractsState = initialState,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case CLEAR_CONTRACTS:
      return clearContracts(state);
    case CONTRACT_BANK_ADAPTER:
      return contractBankAdapter(state, payload);
    case CONTRACT_BANK_EXTENSION:
      return contractBankExtension(state, payload);
    case CONTRACT_BANK_FACTORY:
      return contractBankFactory(state, payload);
    case CONTRACT_CONFIGURATION:
      return contractConfiguration(state, payload);
    case CONTRACT_COUPON_ONBOARDING:
      return contractCouponOnboarding(state, payload);
    case CONTRACT_DAO_FACTORY:
      return contractDAOFactory(state, payload);
    case CONTRACT_DAO_REGISTRY:
      return contractDAORegistry(state, payload);
    case CONTRACT_DAO_REGISTRY_ADAPTER:
      return contractDaoRegistryAdapter(state, payload);
    case CONTRACT_DISTRIBUTE:
      return contractDistribute(state, payload);
    case CONTRACT_ERC20_EXTENSION:
      return contractERC20Extension(state, payload);
    case CONTRACT_FINANCING:
      return contractFinancing(state, payload);
    case CONTRACT_GUILDKICK:
      return contractGuildKick(state, payload);
    case CONTRACT_KYC_ONBOARDING:
      return contractKycOnboarding(state, payload);
    case CONTRACT_MANAGING:
      return contractManaging(state, payload);
    case CONTRACT_NFT_EXTENSION:
      return contractNFTExtension(state, payload);
    case CONTRACT_ONBOARDING:
      return contractOnboarding(state, payload);
    case CONTRACT_RAGEQUIT:
      return contractRagequit(state, payload);
    case CONTRACT_TRIBUTE:
      return contractTribute(state, payload);
    case CONTRACT_TRIBUTE_NFT:
      return contractTributeNFT(state, payload);
    case CONTRACT_VOTING:
      return contractVoting(state, payload);
    case CONTRACT_VOTING_OP_ROLLUP:
      return contractVoting(state, payload);

    default:
      return state;
  }
}

function clearContracts(state: ContractsState) {
  return {...state, ...initialState};
}

function contractBankFactory(state: ContractsState, payload: any) {
  return {...state, BankFactoryContract: {...payload}};
}

function contractDAOFactory(state: ContractsState, payload: any) {
  return {...state, DaoFactoryContract: {...payload}};
}

function contractDAORegistry(state: ContractsState, payload: any) {
  return {...state, DaoRegistryContract: {...payload}};
}

function contractDaoRegistryAdapter(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, DaoRegistryAdapterContract: {...payload}};
}

function contractBankExtension(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, BankExtensionContract: {...payload}};
}

function contractConfiguration(state: ContractsState, payload: any) {
  return {...state, ConfigurationContract: {...payload}};
}

function contractDistribute(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, DistributeContract: {...payload}};
}

function contractFinancing(state: ContractsState, payload: any) {
  return {...state, FinancingContract: {...payload}};
}

function contractGuildKick(state: ContractsState, payload: any) {
  return {...state, GuildKickContract: {...payload}};
}

function contractOnboarding(state: ContractsState, payload: any) {
  return {...state, OnboardingContract: {...payload}};
}

function contractRagequit(state: ContractsState, payload: any) {
  return {...state, RagequitContract: {...payload}};
}

function contractTribute(state: ContractsState, payload: any): ContractsState {
  return {...state, TributeContract: {...payload}};
}

function contractVoting(state: ContractsState, payload: any): ContractsState {
  return {...state, VotingContract: {...payload}};
}

function contractManaging(state: ContractsState, payload: any): ContractsState {
  return {...state, ManagingContract: {...payload}};
}

function contractBankAdapter(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, BankAdapterContract: {...payload}};
}

function contractTributeNFT(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, TributeNFTContract: {...payload}};
}

function contractCouponOnboarding(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, CouponOnboardingContract: {...payload}};
}

function contractKycOnboarding(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, KycOnboardingContract: {...payload}};
}

function contractNFTExtension(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, NFTExtensionContract: {...payload}};
}

function contractERC20Extension(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, ERC20ExtensionContract: {...payload}};
}
