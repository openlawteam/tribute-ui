import {SET_SUBGRAPH_NETWORK_STATUS} from './actions';
import {SubgraphNetworkStatus, SubgraphNetworkStatusState} from './types';

const INITIAL_STATE = {
  status: SubgraphNetworkStatus.OK,
};

export default function reducer(
  state: SubgraphNetworkStatusState = INITIAL_STATE,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case SET_SUBGRAPH_NETWORK_STATUS:
      return setSubgraphNetworkStatus(state, payload);
    default:
      return state;
  }
}

function setSubgraphNetworkStatus(
  state: Partial<SubgraphNetworkStatusState>,
  payload: Record<string, any>
) {
  return {...state, ...payload};
}
