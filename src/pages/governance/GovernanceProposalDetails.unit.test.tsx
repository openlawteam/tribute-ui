import {render, screen, waitFor} from '@testing-library/react';
import {useHistory} from 'react-router';
import userEvent from '@testing-library/user-event';

import {BURN_ADDRESS} from '../../util/constants';
import {DEFAULT_PROPOSAL_HASH} from '../../test/helpers';
import {rest, server, graphql} from '../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../config';
import App from '../../App';
import GovernanceProposalDetails from './GovernanceProposalDetails';
import Wrapper from '../../test/Wrapper';

const mockWeb3ResponsesDraft: Parameters<typeof Wrapper>[0]['getProps'] = ({
  mockWeb3Provider,
  web3Instance,
}) => {
  /**
   * Mock results for `useProposalsVotingAdapter`
   */

  // Mock `dao.votingAdapter` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [0, [web3Instance.eth.abi.encodeParameter('address', BURN_ADDRESS)]]
    )
  );
};

describe('GovernanceProposalDetails unit tests', () => {
  test('should render proposal', async () => {
    // Using the `<App />` let's the governance details page access the `proposalId` param from `useParams`.
    function GoToGovernanceDetailsViaApp() {
      const history = useHistory();

      history.push(`/governance/${DEFAULT_PROPOSAL_HASH}`);

      return <App />;
    }

    server.use(
      rest.get(`http://localhost/favicon.ico`, async (_req, res, ctx) =>
        res(ctx.status(200))
      )
    );

    server.use(
      graphql.query('GetTokenHolderBalances', (_, res, ctx) => {
        return res(ctx.data({tokens: []}));
      })
    );

    render(
      <Wrapper useInit useWallet getProps={mockWeb3ResponsesDraft}>
        <GoToGovernanceDetailsViaApp />
      </Wrapper>
    );

    // Menu item and title
    expect(screen.getAllByText(/^governance$/i).length).toBe(2);
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
      // SVG
      expect(screen.getByLabelText(/^proposal status$/i)).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBe(2);
      expect(screen.getByLabelText(/0% yes votes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/0% no votes/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      // SVG
      expect(screen.getByLabelText(/^proposal status$/i)).toBeInTheDocument();
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
      expect(
        screen.getByText(/^something went wrong while getting the proposal\.$/i)
      ).toBeInTheDocument();
    });
  });

  test('can click "view all" button to go to /governance', async () => {
    let accessHistory: any;

    server.use(
      graphql.query('GetTokenHolderBalances', (_, res, ctx) => {
        return res(ctx.data({tokens: []}));
      })
    );

    // Using the `<App />` let's the governance details page access the `proposalId` param from `useParams`.
    function GoToGovernanceDetailsViaApp() {
      const history = useHistory();

      history.push(`/governance/${DEFAULT_PROPOSAL_HASH}`);

      accessHistory = history;

      return <App />;
    }

    render(
      <Wrapper useInit useWallet getProps={mockWeb3ResponsesDraft}>
        <GoToGovernanceDetailsViaApp />
      </Wrapper>
    );

    // Temporarily disregard requests for the upcoming `/governance` page to - just return OK.
    server.use(
      ...[rest.get('*', async (_req, res, ctx) => res(ctx.status(200)))]
    );

    expect(screen.getByRole('button', {name: /view all/i})).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', {name: /view all/i}));

    await waitFor(() => {
      expect(accessHistory.location.pathname).toBe('/governance');
    });
  });
});
