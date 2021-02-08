// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useAdapters} from './useAdapters';

describe('useAdapters unit tests', () => {
  test('should get adapters', async () => {
    const {result} = await renderHook(() => useAdapters());
  });
});
