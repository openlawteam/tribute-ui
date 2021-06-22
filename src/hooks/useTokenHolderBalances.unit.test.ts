import {act, renderHook} from '@testing-library/react-hooks';
import {createMockClient} from 'mock-apollo-client';
import {GET_TOKEN_HOLDER_BALANCES} from '../gql';
import {tokenHolderBalancesResponse} from '../test/gqlResponses';
import {useTokenHolderBalances} from './useTokenHolderBalances';
import Wrapper from '../test/Wrapper';

const mockClient = createMockClient();

describe('useTokenHolderBalanceseDao unit tests', () => {
  const queryHandler = jest.fn().mockResolvedValue(tokenHolderBalancesResponse);

  mockClient.setRequestHandler(GET_TOKEN_HOLDER_BALANCES, queryHandler);

  test('should get initial token holder balances', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useTokenHolderBalances(),
        {
          initialProps: {
            useInit: true,
            mockApolloClient: mockClient,
          },
          wrapper: Wrapper,
        }
      );

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.tokenHolderBalances).toBe(undefined);
      expect(result.current.gqlError).toBe(undefined);

      expect(queryHandler).toBeCalledTimes(1);
      expect(queryHandler).toBeCalledWith({tokenAddress: undefined});
    });
  });
});
