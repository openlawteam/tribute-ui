import {SubgraphNetworkStatusState} from './types';

export const SET_SUBGRAPH_NETWORK_STATUS = 'SET_SUBGRAPH_NETWORK_STATUS';

export function setSubgraphNetworkStatus(payload: SubgraphNetworkStatusState) {
  return {type: SET_SUBGRAPH_NETWORK_STATUS, ...payload};
}
