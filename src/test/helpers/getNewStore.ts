import {createStore, applyMiddleware} from 'redux';
import {composeWithDevTools} from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import rootReducer from '../../store/reducers';

export function getNewStore() {
  return createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));
}
