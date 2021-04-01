import {CLEAR_CONNECTED_MEMBER, SET_CONNECTED_MEMBER} from './actions';
import {ConnectedMemberState} from './types';

const INITIAL_STATE = null;

export default function reducer(
  state: ConnectedMemberState = INITIAL_STATE,
  action: any
) {
  const {type, ...payload} = action;

  switch (type) {
    case SET_CONNECTED_MEMBER:
      return setConnectedMemberReducer(state, payload);
    case CLEAR_CONNECTED_MEMBER:
      return clearConnectedMemberReducer();
    default:
      return state;
  }
}

function setConnectedMemberReducer(
  state: Partial<ConnectedMemberState>,
  payload: Record<string, any>
) {
  return {...state, ...payload};
}

function clearConnectedMemberReducer() {
  return INITIAL_STATE;
}
