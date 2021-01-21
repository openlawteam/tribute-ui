import {renderHook} from '@testing-library/react-hooks';

import {useAbortController} from '.';

describe('useAbortController unit tests', () => {
  test('should return correct data when calling useAbortController throughout lifecycle', async () => {
    const {result, unmount} = renderHook(() => useAbortController());

    const abortSpy = result.current.abortController
      ? jest.spyOn(result.current.abortController, 'abort')
      : null;

    // Assert mounted state
    expect(result.current.isMountedRef.current).toBe(true);
    expect(result.current.abortController).toBeInstanceOf(AbortController);

    unmount();

    // Assert unmounted state
    expect(result.current.isMountedRef.current).toBe(false);
    expect(result.current.abortController).toBeInstanceOf(AbortController);

    // Assert `abort()` called on unmount
    expect(abortSpy?.mock.calls.length).toBe(1);
  });
});
