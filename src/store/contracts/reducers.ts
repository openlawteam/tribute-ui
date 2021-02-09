import {
  CONTRACT_BANK_EXTENSION,
  CONTRACT_DAO_REGISTRY,
  CONTRACT_ONBOARDING,
  CONTRACT_VOTING,
} from '../actions';
import {ContractsState} from '../types';

const initialState = {
  BankExtensionContract: null,
  DaoRegistryContract: null,
  OffchainVotingContract: null,
  OnboardingContract: null,
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
    case CONTRACT_VOTING:
      return contractVoting(state, payload);
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

function contractVoting(state: ContractsState, payload: any): ContractsState {
  return {...state, OffchainVotingContract: {...payload}};
}
