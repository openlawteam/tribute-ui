import {CONNECT_MODAL_CLOSE, CONNECT_MODAL_OPEN} from './actions';
import {ConnectModalState} from './types';

const INITIAL_STATE = {
  isOpen: false,
};

export default function reducer(
  state: ConnectModalState = INITIAL_STATE,
  action: any
) {
  const {type} = action;

  switch (type) {
    case CONNECT_MODAL_CLOSE:
      return connectModalClose(state);
    case CONNECT_MODAL_OPEN:
      return connectModalOpen(state);
    default:
      return state;
  }
}

function connectModalClose(
  state: Partial<ConnectModalState>
): ConnectModalState {
  return {...state, isOpen: false};
}

function connectModalOpen(
  state: Partial<ConnectModalState>
): ConnectModalState {
  return {...state, isOpen: true};
}
