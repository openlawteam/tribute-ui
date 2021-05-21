import {render, screen} from '@testing-library/react';

import ProposalAmount from './ProposalAmount';

describe('ProposalAmount component unit tests', () => {
  test('should render correct amount with unit', () => {
    render(<ProposalAmount amount="100.00" amountUnit="ETH" />);

    expect(screen.getByText(/100\.00 eth/i)).toBeInTheDocument();
  });

  test('should render correct second amount with unit', () => {
    render(
      <ProposalAmount
        amount="100"
        amountUnit="OLT"
        amount2="100,000"
        amount2Unit="TRIB"
      />
    );

    expect(screen.getByText(/100 olt/i)).toBeInTheDocument();
    expect(screen.getByText(/100,000 trib/i)).toBeInTheDocument();
  });
});
