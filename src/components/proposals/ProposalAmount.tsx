type ProposalAmountProps = {
  amount: string;
  amountUnit: string;
  amount2?: string;
  amount2Unit?: string;
};

export default function ProposalAmount(props: ProposalAmountProps) {
  const {amount, amountUnit, amount2, amount2Unit} = props;

  /**
   * Render
   */

  return (
    <div className="proposaldetails__amount">
      <span>
        {`${amount} ${amountUnit}`}
        {/* assumes second amount is value requested from the DAO */}
        {amount2 && (
          <>
            <br />
            <small>for</small>
            <br />
            {`${amount2} ${amount2Unit}`}
          </>
        )}
      </span>
    </div>
  );
}
