import {act, renderHook} from '@testing-library/react-hooks';
import {useTokenHolderBalances} from './useTokenHolderBalances';
import Wrapper from '../../../test/Wrapper';
import {server, graphql} from '../../../test/server';

describe('useTokenHolderBalanceseDao unit tests', () => {
  test('should get initial token holder balances', async () => {
    await act(async () => {
      server.use(
        graphql.query('GetTokenHolderBalances', (_, res, ctx) => {
          return res(ctx.data({tokens: {}}));
        })
      );

      const {result, waitForNextUpdate} = renderHook(
        () => useTokenHolderBalances(),
        {
          initialProps: {
            useInit: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.tokenHolderBalances).toBe(undefined);
      expect(result.current.gqlError).toBe(undefined);
    });
  });
});
