// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {useInitAdapterExtensionContracts} from './useInitAdapterExtensionContracts';

describe('useInitAdapterExtensionContracts unit tests', () => {
  test('should init adapters/extensions', async () => {
    const {result} = await renderHook(() => useInitAdapterExtensionContracts());
  });
});
