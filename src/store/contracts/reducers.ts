import {
  CONTRACT_DAO_REGISTRY,
  CONTRACT_ONBOARDING,
  CONTRACT_VOTING,
} from '../actions';

import {ContractsState} from '../../util/types';

const initialState = {
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

function contractDAORegistry(state: ContractsState, payload: any) {
  return {...state, DaoRegistryContract: {...payload}};
}

function contractOnboarding(state: ContractsState, payload: any) {
  return {...state, OnboardingContract: {...payload}};
}

function contractVoting(state: ContractsState, payload: any) {
  return {...state, OffchainVotingContract: {...payload}};
}
