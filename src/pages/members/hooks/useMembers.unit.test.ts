import {renderHook} from '@testing-library/react-hooks';

import useMembers from './useMembers';

describe('useMembers unit tests', () => {
  test('should get members', async () => {
    const {result} = await renderHook(() => useMembers());
  });
});
