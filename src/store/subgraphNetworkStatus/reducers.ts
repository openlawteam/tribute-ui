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
      return setConnectedMemberReducer(state, payload);
    default:
      return state;
  }
}

function setConnectedMemberReducer(
  state: Partial<SubgraphNetworkStatusState>,
  payload: Record<string, any>
) {
  return {...state, ...payload};
}
