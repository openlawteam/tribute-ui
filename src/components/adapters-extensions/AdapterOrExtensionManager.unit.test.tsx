import {render, screen, act, waitFor} from '@testing-library/react';
import {createMockClient} from 'mock-apollo-client';

import {GET_ADAPTERS_EXTENSIONS_AND_DAO} from '../../gql';
import {
  adaptersAndExtensionsResponse,
  daoResponse,
} from '../../test/gqlResponses';

import AdapterOrExtensionManager from './AdapterOrExtensionManager';
import Wrapper from '../../test/Wrapper';

const mockClient = createMockClient();

describe('AdapterOrExtensionManager unit tests', () => {
  const daoAndAdaptersExtensionsResponse = {
    data: {
      tributes: [...daoResponse.data.tributes],
      adapters: [...adaptersAndExtensionsResponse.data.adapters],
      extensions: [...adaptersAndExtensionsResponse.data.extensions],
    },
  };

  mockClient.setRequestHandler(GET_ADAPTERS_EXTENSIONS_AND_DAO, () =>
    Promise.resolve(daoAndAdaptersExtensionsResponse)
  );

  test('should render initial dao manager view without wallet connection', async () => {
    await act(async () => {
      render(
        <Wrapper mockApolloClient={mockClient}>
          <AdapterOrExtensionManager />
        </Wrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/adapter\/extension manager/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /connect your wallet to manage the DAO adapters and extensions/i
          )
        ).toBeInTheDocument();
      });
    });
  });
});
