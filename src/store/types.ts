import {Action} from 'redux';
import {ThunkDispatch} from 'redux-thunk';

import {ConnectedMemberState} from './connectedMember/types';
import {ConnectModalState} from './connectModal/types';
import {ContractsState} from './contracts/types';
import {SubgraphNetworkStatusState} from './subgraphNetworkStatus/types';

export type StoreState = {
  connectModal: ConnectModalState;
  connectedMember: ConnectedMemberState;
  contracts: ContractsState;
  subgraphNetworkStatus: SubgraphNetworkStatusState;
};

/**
 * Used when using useDispatch hook.
 *
 * e.g. useDispatch<ReduxDispatch>();
 *
 * @see https://www.reddit.com/r/typescript/comments/c04mjt/how_to_type_reduxthunks_with_the_new_usedispatch/
 */
export type ReduxDispatch = ThunkDispatch<StoreState, any, Action>;
