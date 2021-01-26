import {combineReducers} from 'redux';

import connectedMember from './connectedMember/reducers';
import contracts from './contracts/reducers';

export default combineReducers({
  connectedMember,
  contracts,
});
