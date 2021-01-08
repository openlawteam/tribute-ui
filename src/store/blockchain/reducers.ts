import {BLOCKCHAIN_CONTRACTS} from '../actions';

import {BlockchainState} from '../../util/types';

const initialState = {};

export default function reducer(
  state: BlockchainState = initialState,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case BLOCKCHAIN_CONTRACTS:
      return smartContracts(state, payload);
    default:
      return state;
  }
}

function smartContracts(state: BlockchainState, payload: any) {
  return {...state, contracts: {...state.contracts, ...payload.contracts}};
}
