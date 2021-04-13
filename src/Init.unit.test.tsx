import {render, screen, waitFor} from '@testing-library/react';

import {server, rest} from './test/server';
import {SNAPSHOT_HUB_API_URL} from './config';
import Init from './Init';
import Wrapper from './test/Wrapper';

describe('<Init /> unit tests', () => {
  test('can render children', async () => {
    render(
      <Wrapper>
        <Init render={() => <p>Child Element</p>} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Child Element')).toBeInTheDocument();
    });
  });

  test('can render something before init starts', async () => {
    render(
      <Wrapper>
        <Init
          render={({isInitComplete, error}) =>
            isInitComplete ? (
              <p>Init OK</p>
            ) : error ? (
              <p>Init Error</p>
            ) : (
              <p>Nothing</p>
            )
          }
        />
      </Wrapper>
    );

    // Do not wait for the async processes to simulate initial render
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });

  test('init can complete', async () => {
    render(
      <Wrapper>
        <Init
          render={({isInitComplete, error}) =>
            isInitComplete ? <p>Init OK</p> : error ? <p>Init Error</p> : null
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Init OK')).toBeInTheDocument();
    });
  });

  test('init can error', async () => {
    // Set a bad network request so an `error` is passed.
    server.use(
      rest.get(`${SNAPSHOT_HUB_API_URL}/api`, async (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    render(
      <Wrapper>
        <Init
          render={({isInitComplete, error}) =>
            isInitComplete ? <p>Init OK</p> : error ? <p>Init Error</p> : null
          }
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Init Error')).toBeInTheDocument();
    });
  });
});
