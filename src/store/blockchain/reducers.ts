import {
  BLOCKCHAIN_CONTRACTS,
  BLOCKCHAIN_WALLET_AUTHENTICATED,
  BLOCKCHAIN_WEB3_STATE,
  CONNECTED_ADDRESS,
} from '../actions';

import {BlockchainState} from '../../util/types';

const initialState = {
  walletAuthenticated: false,
};

export default function reducer(
  state: BlockchainState = initialState,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case BLOCKCHAIN_CONTRACTS:
      return smartContracts(state, payload);
    case BLOCKCHAIN_WALLET_AUTHENTICATED:
      return walletAuthenticated(state, payload);
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

function walletAuthenticated(
  state: BlockchainState,
  {walletAuthenticated}: any
) {
  return {...state, walletAuthenticated};
}

function web3State(state: BlockchainState, {web3State}: any) {
  return {...state, web3State};
}
