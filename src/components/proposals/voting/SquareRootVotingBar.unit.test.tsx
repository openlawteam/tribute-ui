import {render, screen} from '@testing-library/react';

import {SquareRootVotingBar} from './SquareRootVotingBar';

describe('SquareRootVotingBar unit tests', () => {
  test('should show correct percentages', () => {
    render(
      <SquareRootVotingBar
        yesUnits={400000}
        noUnits={200000}
        totalUnits={10000000}
        votingExpired={true}
        showPercentages={true}
      />
    );

    expect(screen.getByText(/^4%$/i)).toBeInTheDocument();
    expect(screen.getByText(/^2%$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^4% yes votes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^2% no votes$/i)).toBeInTheDocument();
  });

  test('should show correct percentages to two decimal places', () => {
    render(
      <SquareRootVotingBar
        yesUnits={400000}
        noUnits={200000}
        totalUnits={3000000}
        votingExpired={true}
        showPercentages={true}
      />
    );

    expect(screen.getByText(/^13.33%$/i)).toBeInTheDocument();
    expect(screen.getByText(/^6.67%$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^13.33% yes votes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^6.67% no votes$/i)).toBeInTheDocument();
  });

  test('should not show percentages if `showPercentages` is false', () => {
    render(
      <SquareRootVotingBar
        yesUnits={400000}
        noUnits={200000}
        totalUnits={10000000}
        votingExpired={true}
        showPercentages={false}
      />
    );

    expect(() => screen.getByText(/^4%$/i)).toThrow();
    expect(() => screen.getByText(/^2%$/i)).toThrow();
    expect(screen.getByLabelText(/^4% yes votes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^2% no votes$/i)).toBeInTheDocument();
  });

  test('no results should display if units values are not provided yet (i.e. async values)', () => {
    render(
      <SquareRootVotingBar
        yesUnits={undefined}
        noUnits={undefined}
        totalUnits={undefined}
        votingExpired={false}
        showPercentages={true}
      />
    );

    expect(screen.getAllByText(/^0%$/i)).toHaveLength(2);
    expect(screen.getByLabelText(/^0% yes votes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^0% no votes$/i)).toBeInTheDocument();
  });
});
