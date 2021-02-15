import {
  CONTRACT_DAO_FACTORY,
  CONTRACT_DAO_REGISTRY,
  CONTRACT_BANK,
  CONTRACT_CONFIGURATION,
  CONTRACT_FINANCING,
  CONTRACT_GUILDKICK,
  CONTRACT_OFFCHAIN_VOTING,
  CONTRACT_ONBOARDING,
  CONTRACT_NONVOTING_ONBOARDING,
  CONTRACT_MANAGING,
  CONTRACT_RAGEQUIT,
  CONTRACT_VOTING,
} from '../actions';
import {ContractsState} from '../types';

const initialState = {
  DaoFactoryContract: null,
  DaoRegistryContract: null,
  BankContract: null,
  ConfigurationContract: null,
  FinancingContract: null,
  GuildBankContract: null,
  OffchainVotingContract: null,
  OnboardingContract: null,
  VotingContract: null,
  NonVotingOnboadingContract: null,
  ManagingContract: null,
  RagequitContract: null,
};

export default function reducer(
  state: ContractsState = initialState,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case CONTRACT_DAO_FACTORY:
      return contractDAOFactory(state, payload);
    case CONTRACT_DAO_REGISTRY:
      return contractDAORegistry(state, payload);
    case CONTRACT_BANK:
      return contractBank(state, payload);
    case CONTRACT_CONFIGURATION:
      return contractConfiguration(state, payload);
    case CONTRACT_FINANCING:
      return contractFinancing(state, payload);
    case CONTRACT_GUILDKICK:
      return contractGuildBank(state, payload);
    case CONTRACT_NONVOTING_ONBOARDING:
      return contractNonVotingOnboarding(state, payload);
    case CONTRACT_MANAGING:
      return contractManaging(state, payload);
    case CONTRACT_RAGEQUIT:
      return contractRagequit(state, payload);
    case CONTRACT_VOTING:
      return contractVoting(state, payload);
    case CONTRACT_ONBOARDING:
      return contractOnboarding(state, payload);
    case CONTRACT_OFFCHAIN_VOTING:
      return contractOffchainVoting(state, payload);
    default:
      return state;
  }
}

function contractDAOFactory(state: ContractsState, payload: any) {
  return {...state, DaoFactoryContract: {...payload}};
}

function contractDAORegistry(state: ContractsState, payload: any) {
  return {...state, DaoRegistryContract: {...payload}};
}

function contractBank(state: ContractsState, payload: any) {
  return {...state, BankContract: {...payload}};
}

function contractConfiguration(state: ContractsState, payload: any) {
  return {...state, ConfigurationContract: {...payload}};
}

function contractFinancing(state: ContractsState, payload: any) {
  return {...state, FinancingContract: {...payload}};
}

function contractGuildBank(state: ContractsState, payload: any) {
  return {...state, GuildBankContract: {...payload}};
}

function contractOffchainVoting(state: ContractsState, payload: any) {
  return {...state, OffchainVotingContract: {...payload}};
}

function contractOnboarding(state: ContractsState, payload: any) {
  return {...state, OnboardingContract: {...payload}};
}

function contractVoting(state: ContractsState, payload: any) {
  return {...state, VotingContract: {...payload}};
}

function contractNonVotingOnboarding(state: ContractsState, payload: any) {
  return {...state, NonVotingOnboadingContract: {...payload}};
}

function contractManaging(state: ContractsState, payload: any) {
  return {...state, ManagingContract: {...payload}};
}

function contractRagequit(state: ContractsState, payload: any) {
  return {...state, RagequitContract: {...payload}};
}
