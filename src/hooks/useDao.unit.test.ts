import {act, renderHook} from '@testing-library/react-hooks';
import {useDao} from './useDao';
import {server, graphql} from '../test/server';
import Wrapper from '../test/Wrapper';

describe('useDao unit tests', () => {
  test('should get inital dao state', async () => {
    await act(async () => {
      server.use(
        graphql.query('GetDao', (_, res, ctx) => {
          return res(ctx.data({tributeDaos: []}));
        })
      );

      const {result, waitForNextUpdate} = renderHook(() => useDao(), {
        initialProps: {
          useInit: true,
        },
        wrapper: Wrapper,
      });

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.dao).toBe(undefined);
      expect(result.current.gqlError).toBe(undefined);
    });
  });
});
