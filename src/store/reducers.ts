import {combineReducers} from 'redux';

import connectedMember from './connectedMember/reducers';
import connectModal from './connectModal/reducers';
import contracts from './contracts/reducers';
import subgraphNetworkStatus from './subgraphNetworkStatus/reducers';

export default combineReducers({
  connectModal,
  connectedMember,
  contracts,
  subgraphNetworkStatus,
});
