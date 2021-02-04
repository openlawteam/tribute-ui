// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useDao} from './useDao';

describe('useDao unit tests', () => {
  test('should get dao', async () => {
    const {result} = await renderHook(() => useDao());
  });
});
