// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useCounter} from './useCounter';

describe('useCounter unit tests', () => {
  test('should increment', async () => {
    const {result} = await renderHook(() => useCounter());

    const [count, dispatch] = result.current;

    // Assert initial state
    expect(count).toBe(0);

    // Increment
    act(() => {
      dispatch({type: 'increment'});
    });

    // Assert incremented state
    expect(result.current[0]).toBe(1);

    // Increment
    act(() => {
      dispatch({type: 'increment'});
    });

    // Assert incremented state
    expect(result.current[0]).toBe(2);
  });
});
