import {render, screen, waitFor} from '@testing-library/react';

import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import GovernanceProposalDetails from './GovernanceProposalDetails';
import Wrapper from '../../test/Wrapper';

describe('GovernanceProposalDetails unit tests', () => {
  test('should render proposal', async () => {
    render(
      <Wrapper>
        <GovernanceProposalDetails />
      </Wrapper>
    );

    expect(screen.getByText(/governance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /view all/i})).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/loading content\.\.\./i)
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/^test snapshot proposal$/i)).toBeInTheDocument();
      expect(
        screen.getByText(/test snapshot proposal body content\./i)
      ).toBeInTheDocument();
    });

    /**
     * Vote actions
     *
     * @note is an ended vote as per default mocked repsonse in our test suite.
     */

    await waitFor(() => {
      expect(
        screen.getByLabelText(/counting down until voting ends/i)
      ).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBe(2);
      expect(screen.getByLabelText(/0% yes votes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/0% no votes/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText(/counting down until voting ends/i)
      ).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBe(2);
      expect(screen.getByLabelText(/0% yes votes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/0% no votes/i)).toBeInTheDocument();

      // Wait for status
      expect(screen.getByLabelText(/failed/i)).toBeInTheDocument();
    });
  });

  test('should render 404 if not found', async () => {
    // Mock 404 response from Snapshot Hub (they don't use 404 error code)
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
        async (_req, res, ctx) => res(ctx.json({}))
      )
    );

    render(
      <Wrapper>
        <GovernanceProposalDetails />
      </Wrapper>
    );

    expect(screen.getByText(/governance/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/loading content\.\.\./i)
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/44/i)).toBeInTheDocument();
      expect(screen.getByText(/😵/i)).toBeInTheDocument();
    });
  });

  test('should render error if proposal could not be fetched', async () => {
    // Mock 500 response from Snapshot Hub
    server.use(
      rest.get(
        `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
        async (_req, res, ctx) => res(ctx.status(500))
      )
    );

    render(
      <Wrapper>
        <GovernanceProposalDetails />
      </Wrapper>
    );

    expect(screen.getByText(/governance/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/loading content\.\.\./i)
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/^something went wrong\.$/i)).toBeInTheDocument();
      expect(
        screen.getByText(/something went wrong while getting the proposal/i)
      ).toBeInTheDocument();
    });
  });
});
