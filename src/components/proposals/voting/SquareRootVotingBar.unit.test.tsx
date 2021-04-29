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

    expect(screen.getByText('4%')).toBeInTheDocument();
    expect(screen.getByText('2%')).toBeInTheDocument();
    expect(screen.getByLabelText('4% yes votes')).toBeInTheDocument();
    expect(screen.getByLabelText('2% no votes')).toBeInTheDocument();
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

    expect(() => screen.getByText('4%')).toThrow();
    expect(() => screen.getByText('2%')).toThrow();
    expect(screen.getByLabelText('4% yes votes')).toBeInTheDocument();
    expect(screen.getByLabelText('2% no votes')).toBeInTheDocument();
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

    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.getByLabelText('0% yes votes')).toBeInTheDocument();
    expect(screen.getByLabelText('0% no votes')).toBeInTheDocument();
  });
});
