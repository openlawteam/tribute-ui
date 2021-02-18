import {
  CONTRACT_BANK_EXTENSION,
  CONTRACT_DAO_REGISTRY,
  CONTRACT_MANAGING,
  CONTRACT_ONBOARDING,
  CONTRACT_TRIBUTE,
  CONTRACT_VOTING_OP_ROLLUP,
} from '../actions';
import {ContractsState} from '../types';

const initialState = {
  BankExtensionContract: null,
  DaoRegistryContract: null,
  ManagingContract: null,
  OnboardingContract: null,
  TributeContract: null,
  VotingContract: null,
};

export default function reducer(
  state: ContractsState = initialState,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case CONTRACT_BANK_EXTENSION:
      return contractBankExtension(state, payload);
    case CONTRACT_DAO_REGISTRY:
      return contractDAORegistry(state, payload);
    case CONTRACT_ONBOARDING:
      return contractOnboarding(state, payload);
    case CONTRACT_TRIBUTE:
      return contractTribute(state, payload);
    case CONTRACT_VOTING_OP_ROLLUP:
      return contractVoting(state, payload);
    case CONTRACT_MANAGING:
      return contractManaging(state, payload);
    default:
      return state;
  }
}

function contractBankExtension(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, BankExtensionContract: {...payload}};
}

function contractDAORegistry(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, DaoRegistryContract: {...payload}};
}

function contractOnboarding(
  state: ContractsState,
  payload: any
): ContractsState {
  return {...state, OnboardingContract: {...payload}};
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
