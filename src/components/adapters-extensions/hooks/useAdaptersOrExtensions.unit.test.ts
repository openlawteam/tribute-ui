import {renderHook, act} from '@testing-library/react-hooks';
// import {waitFor} from '@testing-library/react';

import {AsyncStatus} from '../../../util/types';
import Wrapper from '../../../test/Wrapper';

import {useAdaptersOrExtensions} from './useAdaptersOrExtensions';

describe('useAdaptersOrExtensions unit tests', () => {
  test('should return correct data when wallet is disconnected', async () => {
    const {result} = renderHook(() => useAdaptersOrExtensions(), {
      initialProps: {
        useInit: true,
      },
      wrapper: Wrapper,
    });

    // Assert initial state
    expect(result.current.adapterExtensionStatus).toBe(AsyncStatus.STANDBY);
    expect(result.current.getAdapterOrExtensionFromRedux).toBeInstanceOf(
      Function
    );
    expect(result.current.registeredAdaptersOrExtensions).toBe(undefined);
    expect(result.current.unRegisteredAdaptersOrExtensions).toBe(undefined);
  });
});
