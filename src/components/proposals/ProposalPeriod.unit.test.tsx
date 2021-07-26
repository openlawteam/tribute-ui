import {render, screen, waitFor} from '@testing-library/react';

import ProposalPeriod from './ProposalPeriod';

describe('ProposalPeriod unit tests', () => {
  test('should render countdown when started', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 10000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
        expect(screen.getByText(/^8 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
        expect(screen.getByText(/^7 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
        expect(screen.getByText(/^6 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );
  });

  test('should not render countdown when ended', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs - 10000;
    const countdownVotingEndMs: number = nowMs - 5000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^ended$/i)).toBeInTheDocument();

      // E.g. 1 sec
      expect(() => screen.getByText(/\d{1,} sec?s$/i)).toThrow();
    });
  });

  test('should render countdown when not yet started', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs + 10000;
    const countdownVotingEndMs: number = nowMs + 15000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^starts:/i)).toBeInTheDocument();
        expect(screen.getByText(/^8 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^starts:/i)).toBeInTheDocument();
        expect(screen.getByText(/^7 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );

    await waitFor(
      () => {
        expect(screen.getByText(/^starts:/i)).toBeInTheDocument();
        expect(screen.getByText(/^6 secs$/i)).toBeInTheDocument();
      },
      {timeout: 5000}
    );
  });

  test('should render countdown when not yet started and longer than 2 days', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs + 86400 * 1000 * 4;
    const countdownVotingEndMs: number = nowMs + 86400 * 1000 * 8;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^starts:/i)).toBeInTheDocument();
      expect(screen.getByText(/^~3 days$/i)).toBeInTheDocument();
    });
  });

  test('should render days countdown', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 86400 * 1000 * 3;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^ends:/i)).toBeInTheDocument();

      expect(
        screen.getByText(/^2 days : 23 hrs : 59 mins$/i)
      ).toBeInTheDocument();
    });
  });

  test('should render hours countdown', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 86400 * 1000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/^23 hrs : 59 mins$/i)).toBeInTheDocument();
    });
  });

  test('should render minutes countdown', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 3600 * 1000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/^59 mins : 59 secs$/i)).toBeInTheDocument();
    });
  });

  test('should render seconds countdown', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 60 * 1000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^ends:/i)).toBeInTheDocument();
      expect(screen.getByText(/^59 secs$/i)).toBeInTheDocument();
    });
  });

  test('should render custom ended label', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs - 10000;
    const countdownVotingEndMs: number = nowMs - 5000;

    render(
      <ProposalPeriod
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
        endedLabel="So0o ended!"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^So0o ended!$/i)).toBeInTheDocument();

      // E.g. 1 sec
      expect(() => screen.getByText(/\d{1,} sec?s$/i)).toThrow();
    });
  });

  test('should render custom ends label', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs;
    const countdownVotingEndMs: number = nowMs + 10000;

    render(
      <ProposalPeriod
        endLabel="Neva gunna end!"
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^neva gunna end!/i)).toBeInTheDocument();
      expect(screen.getByText(/^\d{1,} sec?s$/i)).toBeInTheDocument();
    });
  });

  test('should render custom starts label', async () => {
    const nowMs: number = Date.now();
    const countdownVotingStartMs: number = nowMs + 10000;
    const countdownVotingEndMs: number = nowMs + 15000;

    render(
      <ProposalPeriod
        startLabel="Neva gunna start!"
        endPeriodMs={countdownVotingEndMs}
        startPeriodMs={countdownVotingStartMs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/^neva gunna start!/i)).toBeInTheDocument();
      expect(screen.getByText(/^\d{1,} sec?s$/i)).toBeInTheDocument();
    });
  });
});
