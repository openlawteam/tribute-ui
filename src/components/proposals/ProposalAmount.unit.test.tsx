import {render, screen} from '@testing-library/react';

import ProposalAmount from './ProposalAmount';

describe('ProposalAmount component unit tests', () => {
  test('should render correct amount', () => {
    render(<ProposalAmount amount="100000000000000000000" />);

    expect(screen.getByText(/100\.00 eth/i)).toBeInTheDocument();
  });

  test('should render correct decimal amount', () => {
    render(<ProposalAmount amount="108800000000000000000" />);

    expect(screen.getByText(/108\.80 eth/i)).toBeInTheDocument();
  });

  test('should render correct small decimal amount', () => {
    render(<ProposalAmount amount="10880000000000000" />);

    expect(screen.getByText(/0\.01 eth/i)).toBeInTheDocument();
  });

  test('should render correct tiny decimal amount', () => {
    render(<ProposalAmount amount="1088000000000000" />);

    expect(screen.getByText(/0\.0011 eth/i)).toBeInTheDocument();
  });

  test('should render fallback UI if error', () => {
    render(<ProposalAmount amount="wowbad" />);

    expect(screen.getByText(/\u2026 eth/i)).toBeInTheDocument();
  });
});
