import {renderHook, act} from '@testing-library/react-hooks';
import {server, graphql} from '../../../test/server';
import {AsyncStatus} from '../../../util/types';
import Wrapper from '../../../test/Wrapper';
import {adaptersAndExtensionsResponse} from '../../../test/gqlResponses';
import {useAdaptersOrExtensions} from './useAdaptersOrExtensions';

describe('useAdaptersOrExtensions unit tests', () => {
  test('should return correct data when wallet is disconnected', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useAdaptersOrExtensions(),
        {
          initialProps: {
            useInit: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.adapterExtensionStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.getAdapterOrExtensionFromRedux).toBeInstanceOf(
        Function
      );
      expect(result.current.registeredAdaptersOrExtensions).toBe(undefined);
      expect(result.current.unRegisteredAdaptersOrExtensions).toBe(undefined);
    });
  });

  test('should return correct data when wallet is connected', async () => {
    await act(async () => {
      server.use(
        graphql.query('GetAdaptersAndExtensions', (_, res, ctx) => {
          return res(ctx.data(adaptersAndExtensionsResponse));
        })
      );

      const {result, waitForNextUpdate} = renderHook(
        () => useAdaptersOrExtensions(),
        {
          initialProps: {
            useInit: true,
            useWallet: true,
          },
          wrapper: Wrapper,
        }
      );

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.adapterExtensionStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.getAdapterOrExtensionFromRedux).toBeInstanceOf(
        Function
      );
      expect(result.current.registeredAdaptersOrExtensions).toBe(undefined);
      expect(result.current.unRegisteredAdaptersOrExtensions).toBe(undefined);
    });
  });
});
