import {render, screen, waitFor} from '@testing-library/react';

import {VotingStatus} from './VotingStatus';

describe('VotingStatus unit tests', () => {
  // @note This test uses an adjusted Jest timeout
  test('can render and show correct UI', async () => {
    const nowMs = Date.now();

    // Voting started
    const {rerender} = render(
      <VotingStatus
        hasVotingEnded={false}
        noUnits={100000}
        renderStatus={() => 'You are in voting'}
        renderTimer={(ProposalPeriodComponent) => (
          <ProposalPeriodComponent
            startPeriodMs={nowMs}
            endPeriodMs={nowMs + 3000}
          />
        )}
        totalUnits={10000000}
        yesUnits={500000}
      />
    );

    expect(screen.getByText(/you are in voting/i)).toBeInTheDocument();
    expect(screen.getByText(/5%/i)).toBeInTheDocument();
    expect(screen.getByText(/5%/i)).toBeInTheDocument();

    // ClockSVG label
    expect(screen.getByLabelText(/^proposal status$/i)).toBeInTheDocument();

    /**
     * Assert countdown
     * @note The timing can be flakey so we keep the matching generic (we know it will be between 0-2secs)
     */
    await waitFor(() => {
      expect(screen.getByText(/ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/^[012] secs?/i)).toBeInTheDocument();
    });

    // Grace period
    rerender(
      <VotingStatus
        hasVotingEnded={true}
        noUnits={100000}
        renderStatus={() => null}
        renderTimer={(ProposalPeriodComponent) => (
          <ProposalPeriodComponent
            startPeriodMs={Date.now()}
            endPeriodMs={Date.now() + 2000}
            endLabel="Grace period:"
          />
        )}
        totalUnits={10000000}
        yesUnits={500000}
      />
    );

    // Assert changing timer and labels: grace period timer (example only, as it may not be how we use it)
    await waitFor(() => {
      expect(screen.getByLabelText(/vote has passed/i)).toBeInTheDocument();
      expect(screen.getByText(/grace period:/i)).toBeInTheDocument();
      expect(screen.getByText(/^[012] secs?/i)).toBeInTheDocument();
    });

    // Voting passed
    rerender(
      <VotingStatus
        hasVotingEnded={true}
        noUnits={100000}
        renderStatus={() => 'Approved'}
        renderTimer={() => null}
        totalUnits={10000000}
        yesUnits={500000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
      // CheckSVG label
      expect(screen.getByLabelText(/vote has passed/i)).toBeInTheDocument();
    });
  }, 10000);
});
