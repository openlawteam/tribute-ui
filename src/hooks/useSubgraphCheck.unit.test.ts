import {renderHook} from '@testing-library/react-hooks';

import {useSubgraphCheck} from './useSubgraphCheck';

describe('useSubgraphCheck unit tests', () => {
  test('should get subgraph status', async () => {
    const {result} = await renderHook(() => useSubgraphCheck());
  });
});
