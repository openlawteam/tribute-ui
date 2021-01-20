import {renderHook} from '@testing-library/react-hooks';

import {useIsMounted} from '.';

describe('useIsMounted unit tests', () => {
  test('should return correct data when calling useIsMounted throughout lifecycle', async () => {
    const {result, unmount} = renderHook(() => useIsMounted());

    // Assert mounted state
    expect(result.current.isMountedRef.current).toBe(true);

    unmount();

    // Assert unmounted state
    expect(result.current.isMountedRef.current).toBe(false);
  });
});
