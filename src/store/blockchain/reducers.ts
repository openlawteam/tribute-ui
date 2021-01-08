import {
  BLOCKCHAIN_CONTRACTS,
  BLOCKCHAIN_WEB3_STATE,
  CONNECTED_ADDRESS,
} from '../actions';

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
    case BLOCKCHAIN_WEB3_STATE:
      return web3State(state, payload);
    case CONNECTED_ADDRESS:
      return connectedAddress(state, payload);
    default:
      return state;
  }
}

function connectedAddress(state: BlockchainState, {connectedAddress}: any) {
  return {...state, connectedAddress};
}

function smartContracts(state: BlockchainState, payload: any) {
  return {...state, contracts: {...state.contracts, ...payload.contracts}};
}

function web3State(state: BlockchainState, {web3State}: any) {
  return {...state, web3State};
}
