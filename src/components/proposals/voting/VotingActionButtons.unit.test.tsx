import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {VotingActionButtons} from './VotingActionButtons';

describe('VotingActionButtons unit tests', () => {
  test('can render', () => {
    render(<VotingActionButtons onClick={() => {}} />);

    expect(screen.getByText(/yes/i)).toBeInTheDocument();
    expect(screen.getByText(/no/i)).toBeInTheDocument();
  });

  test('can receive correct option in click handler', () => {
    const spy = jest.fn();

    render(<VotingActionButtons onClick={spy} />);

    userEvent.click(screen.getByText(/yes/i));

    expect(spy.mock.calls[0][0]).toMatch(/yes/i);

    userEvent.click(screen.getByText(/no/i));

    expect(spy.mock.calls[1][0]).toMatch(/no/i);
  });

  test('can show correct text when voted no', () => {
    render(
      <VotingActionButtons onClick={() => {}} voteChosen={VoteChoices.No} />
    );

    expect(screen.getByText(/^voted no/i)).toBeInTheDocument();
    // SVG check
    expect(screen.getByLabelText(/^you voted no/i)).toBeInTheDocument();
  });

  test('can show correct text when voted yes', () => {
    render(
      <VotingActionButtons onClick={() => {}} voteChosen={VoteChoices.Yes} />
    );

    expect(screen.getByText(/voted yes/i)).toBeInTheDocument();
    // SVG check
    expect(screen.getByLabelText(/^you voted yes/i)).toBeInTheDocument();
  });

  test('can show no text (only progress SVG) when voting no and is disabled', () => {
    render(
      <VotingActionButtons
        onClick={() => {}}
        voteProgress={VoteChoices.No}
        buttonProps={{
          disabled: true,
          'aria-disabled': true,
        }}
      />
    );

    expect(screen.getByRole('button', {name: /voting no/i})).toBeDisabled();
    expect(screen.getByLabelText(/voting no \u2026/i)).toBeInTheDocument();
    expect(() => screen.getByText(/voting no \u2026/i)).toThrow();

    expect(
      screen.getByLabelText(/currently voting no\.\.\./i)
    ).toBeInTheDocument();
  });

  test('can show no text (only progress SVG) when voting yes and is disabled', () => {
    render(
      <VotingActionButtons
        onClick={() => {}}
        voteProgress={VoteChoices.Yes}
        buttonProps={{
          disabled: true,
          'aria-disabled': true,
        }}
      />
    );

    expect(screen.getByRole('button', {name: /voting yes/i})).toBeDisabled();
    expect(screen.getByLabelText(/voting yes \u2026/i)).toBeInTheDocument();
    expect(() => screen.getByText(/voting yes \u2026/i)).toThrow();

    expect(
      screen.getByLabelText(/currently voting yes\.\.\./i)
    ).toBeInTheDocument();
  });
});
