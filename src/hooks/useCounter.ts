import {useReducer} from 'react';

type CounterState = {
  count: number;
};

type CounterAction = {
  type: 'increment';
};

type CounterReturn = [number, React.Dispatch<CounterAction>];

const initialState = {count: 0};

function reducer(state: CounterState, action: CounterAction) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    default:
      return state;
  }
}

/**
 * useCounter
 *
 * A counter which is kept track of via a reducer.
 *
 * @note This is mainly to use inside a custom hook's callback resulting in a
 *  changed dependency for consumer's useEffect when a consumer higher up wants to trigger a "re-run"
 *  (i.e. re-fetch, refresh some data), similarly to dispatching a Redux action again to update the state.
 */
export function useCounter(): CounterReturn {
  const [state, dispatch] = useReducer(reducer, initialState);

  return [state.count, dispatch];
}
