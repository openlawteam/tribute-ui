// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useAdaptersOrExtensions} from './useAdaptersOrExtensions';

describe('useAdaptersOrExtensions unit tests', () => {
  test('should get adapters', async () => {
    const {result} = await renderHook(() => useAdaptersOrExtensions());
  });
});
