import {useEffect, useState} from 'react';
import Web3 from 'web3';

import {formatDecimal} from '../../util/helpers';

type ProposalAmountProps = {
  /**
   * Amount in WEI
   */
  amount: string;
};

export default function ProposalAmount(props: ProposalAmountProps) {
  const {amount} = props;

  const [amountETH, setAmountETH] = useState<string>();

  useEffect(() => {
    try {
      setAmountETH(formatDecimal(Number(Web3.utils.fromWei(amount, 'ether'))));
    } catch (error) {
      // Fallback gracefully to ellipsis
      setAmountETH('\u2026');
    }
  }, [amount]);

  /**
   * Render
   */

  return (
    <div className="proposaldetails__amount">
      <span>{amountETH} ETH</span>
    </div>
  );
}
