import {render, screen, waitFor} from '@testing-library/react';

import {VotingStatus} from './VotingStatus';

describe('VotingStatus unit tests', () => {
  test('can render and show correct UI', async () => {
    const nowMs = Date.now();

    // Voting started
    const {rerender} = render(
      <VotingStatus
        renderTimer={(ProposalPeriodComponent) => (
          <ProposalPeriodComponent
            startPeriodMs={nowMs}
            endPeriodMs={nowMs + 3000}
          />
        )}
        renderStatus={() => 'You are in voting'}
        hasVotingEnded={false}
        noShares={100000}
        totalShares={10000000}
        yesShares={500000}
      />
    );

    expect(screen.getByText(/you are in voting/i)).toBeInTheDocument();
    expect(screen.getByText(/5%/i)).toBeInTheDocument();
    expect(screen.getByText(/5%/i)).toBeInTheDocument();
    // ClockSVG label
    expect(
      screen.getByLabelText(/counting down until voting ends/i)
    ).toBeInTheDocument();

    // Assert countdown
    await waitFor(() => {
      expect(screen.getByText(/ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/2 secs/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/1 sec/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      // @note This label probably wouldn't show as we'd render `null` the timer after the vote period was over.
      expect(screen.getByText(/ended/i)).toBeInTheDocument();
    });

    // Grace period
    rerender(
      <VotingStatus
        renderTimer={(ProposalPeriodComponent) => (
          <ProposalPeriodComponent
            startPeriodMs={Date.now()}
            endPeriodMs={Date.now() + 2000}
            endLabel="Grace period ends:"
          />
        )}
        renderStatus={() => null}
        hasVotingEnded={true}
        noShares={100000}
        totalShares={10000000}
        yesShares={500000}
      />
    );

    // Assert changing timer and labels: grace period timer (example only, as it may not be how we use it)
    await waitFor(() => {
      expect(screen.getByLabelText(/vote has passed/i)).toBeInTheDocument();
      expect(screen.getByText(/grace period ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/1 sec/i)).toBeInTheDocument();
    });
    // @note This label probably wouldn't show as we'd render `null` the timer after the grace period was over.
    await waitFor(() => {
      expect(screen.getByText(/ended/i)).toBeInTheDocument();
    });

    // Voting passed
    rerender(
      <VotingStatus
        renderTimer={() => null}
        renderStatus={() => 'Approved'}
        hasVotingEnded={true}
        noShares={100000}
        totalShares={10000000}
        yesShares={500000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
      // CheckSVG label
      expect(screen.getByLabelText(/vote has passed/i)).toBeInTheDocument();
    });
  }, 10000); // long-running test
});
