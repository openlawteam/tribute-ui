// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useValidation} from './useValidation';

describe('useValidation unit tests', () => {
  test('should get validations', async () => {
    const {result} = await renderHook(() => useValidation());
  });
});
