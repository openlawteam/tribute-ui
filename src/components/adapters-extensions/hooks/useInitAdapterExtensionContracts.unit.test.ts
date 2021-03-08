import {renderHook} from '@testing-library/react-hooks';

import {useInitAdapterExtensionContracts} from './useInitAdapterExtensionContracts';

describe('useInitAdapterExtensionContracts unit tests', () => {
  test('should use initAdapterExtensionContract', async () => {
    const {result} = await renderHook(() => useInitAdapterExtensionContracts());

    expect(result.current.initAdapterExtensionContract).toBeInstanceOf(
      Function
    );
  });

  test('should init adapters/extensions', async () => {
    const {result} = await renderHook(() => useInitAdapterExtensionContracts());

    expect(result.current.initAdapterExtensionContract).toBeInstanceOf(
      Function
    );
  });
});
