import {act, render, screen, waitFor} from '@testing-library/react';

import {OffchainVotingStatus} from './OffchainVotingStatus';
import {VotingResult} from '../types';
import Wrapper from '../../../test/Wrapper';

describe('OffchainVotingStatus unit tests', () => {
  const nowMilliseconds = () => Date.now();
  const ONE_DAY_MS: number = 86400 * 1000;
  const approvedRegex: RegExp = /^approved$/i;
  const failedRegex: RegExp = /^failed$/i;
  const votingEndsRegex: RegExp = /^ends:$/i;
  const gracePeriodEndedRegex: RegExp = /^grace period ended$/i;
  const gracePeriodRegex: RegExp = /^grace period:$/i;
  const daysCountdownRegex: RegExp = /^\d{1,} days? : \d{1,} hrs?$/i;
  const secondsCountdownRegex: RegExp = /^\d{1,} secs?$/i;
  const loadingRegex: RegExp = /^getting off-chain voting status$/i;

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

  // @note This test uses an adjusted Jest timeout
  test('should render correct content from voting->passed', async () => {
    const votingStartMs: number = nowMilliseconds();
    const votingEndMs: number = nowMilliseconds() + 5000;

    await act(async () => {
      render(
        <Wrapper useInit useWallet>
          <OffchainVotingStatus
            countdownVotingEndMs={votingEndMs}
            countdownVotingStartMs={votingStartMs}
            votingResult={defaultPassedVotingResult}
          />
        </Wrapper>
      );
    });

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
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: approved
    await waitFor(
      () => {
        expect(screen.getByText(approvedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(loadingRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  // @note This test uses an adjusted Jest timeout
  test('should render correct content from voting->failed', async () => {
    const votingStartMs: number = nowMilliseconds();
    const votingEndMs: number = nowMilliseconds() + 5000;

    await act(async () => {
      render(
        <Wrapper useInit useWallet>
          <OffchainVotingStatus
            countdownVotingEndMs={votingEndMs}
            countdownVotingStartMs={votingStartMs}
            votingResult={defaultFailedVotingResult}
          />
        </Wrapper>
      );
    });

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
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Status: failed
    await waitFor(
      () => {
        expect(screen.getByText(failedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(loadingRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  // @note This test uses an adjusted Jest timeout
  test('should render correct content from voting->passed when grace period props provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const gracePeriodStartMs: number = nowMs + 3500;
    const gracePeriodEndMs: number = nowMs + 9000;

    await act(async () => {
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
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodRegex)).toBeInTheDocument();
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

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
        expect(() => screen.getByText(gracePeriodRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  // @note This test uses an adjusted Jest timeout
  test('should render correct content from voting->failed when grace period props provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const gracePeriodStartMs: number = nowMs + 3500;
    const gracePeriodEndMs: number = nowMs + 9000;

    await act(async () => {
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
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Status: voting
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      },
      {timeout: 5000}
    );

    // Grace period label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodRegex)).toBeInTheDocument();
        expect(screen.getByText(secondsCountdownRegex)).toBeInTheDocument();

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
        expect(() => screen.getByText(gracePeriodRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  // @note This test uses an adjusted Jest timeout
  test('should render correct content for voting period status when `days > 0`', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + ONE_DAY_MS * 2;
    const gracePeriodStartMs: number = nowMs + ONE_DAY_MS * 2;
    const gracePeriodEndMs: number = nowMs + ONE_DAY_MS * 3;

    await act(async () => {
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
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Voting period label
    await waitFor(
      () => {
        expect(screen.getByText(votingEndsRegex)).toBeInTheDocument();
        expect(screen.getByText(daysCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndMs)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  // @note This test uses an adjusted Jest timeout
  test('should render correct content for grace period status when `days > 0`', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs - ONE_DAY_MS;
    const votingEndMs: number = nowMs;
    const gracePeriodStartMs: number = nowMs;
    const gracePeriodEndMs: number = nowMs + ONE_DAY_MS * 2;

    await act(async () => {
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
    });

    // Percentages
    await waitFor(() => {
      expect(screen.getByText(/1%/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodRegex)).toThrow();
      expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
      expect(() => screen.getByText(votingEndsRegex)).toThrow();
    });

    // Grace period label
    await waitFor(
      () => {
        expect(screen.getByText(gracePeriodRegex)).toBeInTheDocument();

        expect(screen.getByText(daysCountdownRegex)).toBeInTheDocument();

        expect(() => screen.getByLabelText(loadingRegex)).toThrow();
        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(gracePeriodEndedRegex)).toThrow();
        expect(() => screen.getByText(votingEndsRegex)).toThrow();
      },
      {timeout: 5000}
    );
  }, 10000);

  test('should render correct content when `renderStatus` provided', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs - 5000;
    const votingEndMs: number = nowMs;
    const gracePeriodStartMs: number = nowMs + 500;
    const gracePeriodEndMs: number = nowMs + 3000;
    const customStatusRegex: RegExp = /what a great status!/i;

    let rerender: ReturnType<typeof render>['rerender'];

    await act(async () => {
      const {rerender: rr} = render(
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
              if (
                votingStartEndInitReady &&
                hasVotingStarted &&
                hasVotingEnded
              ) {
                return <span>What a great status!</span>;
              }
            }}
            votingResult={defaultPassedVotingResult}
          />
        </Wrapper>
      );

      rerender = rr;
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(customStatusRegex)).toThrow();
    });

    // Custom label
    await waitFor(
      () => {
        expect(screen.getByText(customStatusRegex)).toBeInTheDocument();

        expect(() => screen.getByText(approvedRegex)).toThrow();
        expect(() => screen.getByText(loadingRegex)).toThrow();
      }
      // {timeout: 5000}
    );

    const renderStatusSpy = jest.fn();

    // Re-render with custom status for when grace period ended and waiting on contract
    await act(async () => {
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
    });

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

  test('should render correct content when `renderStatus` returns falsy or `Fragment`', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs - 5000;
    const votingEndMs: number = nowMs;
    const gracePeriodStartMs: number = nowMs + 500;
    const gracePeriodEndMs: number = nowMs + 3000;

    let rerender: ReturnType<typeof render>['rerender'];

    await act(async () => {
      const {rerender: rr} = render(
        <Wrapper useInit useWallet>
          <OffchainVotingStatus
            countdownVotingStartMs={votingStartMs}
            countdownVotingEndMs={votingEndMs}
            countdownGracePeriodStartMs={gracePeriodStartMs}
            countdownGracePeriodEndMs={gracePeriodEndMs}
            // Render a falsy (e.g. `false`, `undefined`, `0`, etc.)status
            renderStatus={() => {
              return '';
            }}
            votingResult={defaultPassedVotingResult}
          />
        </Wrapper>
      );

      rerender = rr;
    });

    // Status: loader
    await waitFor(() => {
      expect(screen.getByLabelText(loadingRegex)).toBeInTheDocument();

      expect(() => screen.getByText(approvedRegex)).toThrow();
    });

    // Custom label
    await waitFor(
      () => {
        expect(screen.getByText(approvedRegex)).toBeInTheDocument();

        expect(() => screen.getByText(loadingRegex)).toThrow();
      }
      // {timeout: 5000}
    );

    // Re-render with custom status for when grace period ended and waiting on contract
    await act(async () => {
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
    });

    await waitFor(() => {
      expect(() => screen.getByText(approvedRegex)).toThrow();
      expect(() => screen.getByText(loadingRegex)).toThrow();
    });
  });

  test('should call `onVotingPeriodChange` throughout voting period', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs;
    const votingEndMs: number = nowMs + 3000;
    const spy = jest.fn();

    await act(async () => {
      render(
        <Wrapper useInit useWallet>
          <OffchainVotingStatus
            countdownVotingEndMs={votingEndMs}
            countdownVotingStartMs={votingStartMs}
            onVotingPeriodChange={spy}
            votingResult={defaultPassedVotingResult}
          />
        </Wrapper>
      );
    });

    await waitFor(
      () => {
        expect(spy.mock.calls[0]?.[0]).toEqual({
          hasVotingEnded: false,
          hasVotingStarted: true,
          proposalId: undefined,
          votingStartEndInitReady: true,
        });
      },
      {timeout: 3000}
    );

    await waitFor(
      () => {
        expect(spy.mock.calls[1]?.[0]).toEqual({
          hasVotingEnded: true,
          hasVotingStarted: true,
          proposalId: undefined,
          votingStartEndInitReady: true,
        });
      },
      {timeout: 3000}
    );

    expect(spy.mock.calls.length).toBe(2);
  });

  // @note This test uses an adjusted Jest timeout
  test('should call `onGracePeriodChange` throughout grace period', async () => {
    const nowMs = nowMilliseconds();
    const votingStartMs: number = nowMs - 5000;
    const votingEndMs: number = nowMs - 1000;
    const gracePeriodStartMs: number = nowMs;
    const gracePeriodEndMs: number = nowMs + 3000;
    const spy = jest.fn();

    await act(async () => {
      render(
        <Wrapper useInit useWallet>
          <OffchainVotingStatus
            countdownGracePeriodEndMs={gracePeriodEndMs}
            countdownGracePeriodStartMs={gracePeriodStartMs}
            countdownVotingEndMs={votingEndMs}
            countdownVotingStartMs={votingStartMs}
            onGracePeriodChange={spy}
            votingResult={defaultPassedVotingResult}
          />
        </Wrapper>
      );
    });

    await waitFor(
      () => {
        expect(spy.mock.calls[0]?.[0]).toEqual({
          gracePeriodStartEndInitReady: true,
          hasGracePeriodEnded: false,
          hasGracePeriodStarted: true,
          proposalId: undefined,
        });
      },
      {timeout: 5000}
    );

    await waitFor(
      () => {
        expect(spy.mock.calls[1]?.[0]).toEqual({
          gracePeriodStartEndInitReady: true,
          hasGracePeriodEnded: true,
          hasGracePeriodStarted: true,
          proposalId: undefined,
        });
      },
      {timeout: 5000}
    );

    expect(spy.mock.calls.length).toBe(2);
  }, 10000);
});
