import {render, screen, waitFor} from '@testing-library/react';

import {OffchainVotingStatus} from './OffchainVotingStatus';
import {VotingResult} from '../types';
import Wrapper from '../../../test/Wrapper';

describe('OffchainVotingStatus unit tests', () => {
  const nowMilliseconds = () => Date.now();
  const approvedRegex: RegExp = /approved/i;
  const failedRegex: RegExp = /failed/i;
  const votingEndsRegex: RegExp = /^ends:/i;
  const gracePeriodEndedRegex: RegExp = /grace period ended/i;
  const gracePeriodEndsRegex: RegExp = /grace period ends/i;
  const loadingRegex: RegExp = /getting off-chain voting status/i;

  const defaultPassedVotingResult: VotingResult = {
    Yes: {
      percentage: 1,
      units: 100000,
    },
    No: {
      percentage: 0,
      units: 0,
    },
    totalUnits: 10000000,
  };

  const defaultFailedVotingResult: VotingResult = {
    Yes: {
      percentage: 0,
      units: 0,
    },
    No: {
      percentage: 1,
      units: 100000,
    },
    totalUnits: 10000000,
  };

  test('should render correct content from voting->passed', async () => {
    const votingStartMs: number = nowMilliseconds();
    const votingEndMs: number = nowMilliseconds() + 3000;

    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingEndMs={votingEndMs}
          countdownVotingStartMs={votingStartMs}
          votingResult={defaultPassedVotingResult}
        />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: approved
    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });
  });

  test('should render correct content from voting->failed', async () => {
    const votingStartMs: number = nowMilliseconds();
    const votingEndMs: number = nowMilliseconds() + 3000;

    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingEndMs={votingEndMs}
          countdownVotingStartMs={votingStartMs}
          votingResult={defaultFailedVotingResult}
        />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: failed
    await waitFor(() => {
      expect(screen.getByText(failedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });
  });

  // @note This test uses adjusted Jest timeouts
  test('should render correct content from voting->passed when grace period props provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const gracePeriodStartMs: number = nowMs + 3000;
    const gracePeriodEndMs: number = nowMs + 9000;

    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownGracePeriodEndMs={gracePeriodEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          votingResult={defaultPassedVotingResult}
          countdownVotingEndMs={votingEndMs}
          countdownVotingStartMs={votingStartMs}
        />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Assert vote approved
    await waitFor(
      () => {
        expect(screen.getByText(approvedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  test('should render correct content from voting->failed when grace period props provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const gracePeriodStartMs: number = nowMs + 3000;
    const gracePeriodEndMs: number = nowMs + 9000;

    render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownGracePeriodEndMs={gracePeriodEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          votingResult={defaultFailedVotingResult}
          countdownVotingEndMs={votingEndMs}
          countdownVotingStartMs={votingStartMs}
        />
      </Wrapper>
    );

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodEndsRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Assert vote approved
    await waitFor(
      () => {
        expect(screen.getByText(failedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndsRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  test('should render correct content when `renderStatus` provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const gracePeriodStartMs: number = nowMs + 3000;
    const gracePeriodEndMs: number = nowMs + 9000;
    const customStatusRegex: RegExp = /what a great status!/i;

    const {rerender} = render(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={votingStartMs}
          countdownVotingEndMs={votingEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          countdownGracePeriodEndMs={gracePeriodEndMs}
          // Render a status
          renderStatus={({
            votingStartEndInitReady,
            hasVotingStarted,
            hasVotingEnded,
          }) => {
            if (votingStartEndInitReady && hasVotingStarted && hasVotingEnded) {
              return <span>What a great status!</span>;
            }
          }}
          votingResult={defaultPassedVotingResult}
        />
      </Wrapper>
    );

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    // Grace period ends label
    await waitFor(
      () => {
        expect(screen.getByText(customStatusRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={votingStartMs}
          countdownVotingEndMs={votingEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          countdownGracePeriodEndMs={gracePeriodEndMs}
          // Return falsy value, or do not provide a prop, in order to reset back to defaults
          renderStatus={() => {
            return undefined;
          }}
          votingResult={defaultPassedVotingResult}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(approvedRegex)).toBeInTheDocument();

      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={votingStartMs}
          countdownVotingEndMs={votingEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          countdownGracePeriodEndMs={gracePeriodEndMs}
          // Render a React.Fragment (truthy, but empty, value) in order to hide the status
          renderStatus={() => {
            return <></>;
          }}
          votingResult={defaultPassedVotingResult}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(loadingRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    const renderStatusSpy = jest.fn();

    // Re-render with custom status for when grace period ended and waiting on contract
    rerender(
      <Wrapper useInit useWallet>
        <OffchainVotingStatus
          countdownVotingStartMs={votingStartMs}
          countdownVotingEndMs={votingEndMs}
          countdownGracePeriodStartMs={gracePeriodStartMs}
          countdownGracePeriodEndMs={gracePeriodEndMs}
          // Use a spy to assert the correct arguments were provided to `renderStatus`
          renderStatus={renderStatusSpy}
          votingResult={defaultPassedVotingResult}
        />
      </Wrapper>
    );

    // Assert spy calls
    await waitFor(() => {
      expect(renderStatusSpy.mock.calls.length > 0).toBe(true);

      expect(Object.keys(renderStatusSpy.mock.calls[0][0])).toEqual([
        'countdownGracePeriodEndMs',
        'countdownGracePeriodStartMs',
        'countdownVotingEndMs',
        'countdownVotingStartMs',
        'didVotePassSimpleMajority',
        'gracePeriodStartEndInitReady',
        'hasGracePeriodEnded',
        'hasGracePeriodStarted',
        'hasVotingEnded',
        'hasVotingStarted',
        'votingStartEndInitReady',
      ]);
    });
  });
});
