import {combineReducers} from 'redux';

import connectedMember from './connectedMember/reducers';
import contracts from './contracts/reducers';
import subgraphNetworkStatus from './subgraphNetworkStatus/reducers';

export default combineReducers({
  connectedMember,
  contracts,
  subgraphNetworkStatus,
});
