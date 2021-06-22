import {act, renderHook} from '@testing-library/react-hooks';
import {createMockClient} from 'mock-apollo-client';
import {useDao} from './useDao';
import {GET_DAO} from '../gql';
import {daoResponse} from '../test/gqlResponses';
import Wrapper from '../test/Wrapper';

const mockClient = createMockClient();

describe('useDao unit tests', () => {
  const queryHandler = jest.fn().mockResolvedValue(daoResponse);

  mockClient.setRequestHandler(GET_DAO, queryHandler);

  test('should get inital dao state', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(() => useDao(), {
        initialProps: {
          useInit: true,
          mockApolloClient: mockClient,
        },
        wrapper: Wrapper,
      });

      await waitForNextUpdate();

      // Assert initial state
      expect(result.current.dao).toBe(undefined);
      expect(result.current.gqlError).toBe(undefined);

      expect(queryHandler).toBeCalledTimes(1);
      expect(queryHandler).toBeCalledWith({id: undefined});
    });
  });
});
