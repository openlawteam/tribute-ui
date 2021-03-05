import {render, screen, waitFor} from '@testing-library/react';

import GovernanceProposalDetails from './GovernanceProposalDetails';
import Wrapper from '../../test/Wrapper';
import {rest, server} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';

describe('GovernanceProposalDetails unit tests', () => {
  test('should render page', async () => {
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
      expect(screen.getByText(/^test snapshot proposal$/i)).toBeInTheDocument();
      expect(
        screen.getByText(/test snapshot proposal body content\./i)
      ).toBeInTheDocument();
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
