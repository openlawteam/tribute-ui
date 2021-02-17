import Web3 from 'web3';
import {toBN} from 'web3-utils';

import {ProposalData} from './types';
import {ContractAdapterNames} from '../web3/types';
import {
  truncateEthAddress,
  formatDecimal,
  formatNumber,
} from '../../util/helpers';
import ProposalAmount from './ProposalAmount';

type RenderActionsArgs = {
  proposal: ProposalData;
};

type ProposalDetailsProps = {
  proposal: ProposalData;
  adapterName: ContractAdapterNames;
  /**
   * A render prop to render any action button flows for a proposal.
   */
  renderActions: (p: RenderActionsArgs) => React.ReactNode;
  /**
   * Option to change the visibility of the amount(s). Defaults to `true`.
   */
  showAmountBadge?: boolean;
};

export default function ProposalDetails(props: ProposalDetailsProps) {
  const {proposal, adapterName, renderActions, showAmountBadge = true} = props;

  const {daoProposal} = proposal;
  const commonData = proposal.getCommonSnapshotProposalData();

  /**
   * Functions
   */

  // @todo Would be better to break this up and move into each adapter's Details
  // component.
  // Need to handle amount(s) depending on the adapter type.
  function renderProposalAmount(): React.ReactNode {
    switch (adapterName) {
      case ContractAdapterNames.onboarding:
        let amount = '\u2026';
        try {
          amount = formatDecimal(
            Number(Web3.utils.fromWei(daoProposal?.amount, 'ether'))
          );
        } catch (error) {
          // Fallback gracefully to ellipsis
        }

        return (
          <ProposalAmount
            amount={amount}
            amountUnit={commonData?.msg.payload.metadata.amountUnit}
          />
        );
      case ContractAdapterNames.tribute:
        let tributeAmount = '\u2026';
        try {
          const divisor = toBN(10).pow(
            toBN(commonData?.msg.payload.metadata.tributeTokenDecimals)
          );
          const beforeDecimal = toBN(daoProposal?.tributeAmount).div(divisor);
          const afterDecimal = toBN(daoProposal?.tributeAmount).mod(divisor);
          const balanceReadable = afterDecimal.eq(toBN(0))
            ? beforeDecimal.toString()
            : `${beforeDecimal.toString()}.${afterDecimal.toString()}`;
          const isTributeAmountInt = !balanceReadable.includes('.');
          tributeAmount = isTributeAmountInt
            ? balanceReadable
            : formatDecimal(Number(balanceReadable));
        } catch (error) {
          // Fallback gracefully to ellipsis
        }

        let requestAmount = '\u2026';
        try {
          requestAmount = formatNumber(daoProposal?.requestAmount);
        } catch (error) {
          // Fallback gracefully to ellipsis
        }
        return (
          <ProposalAmount
            amount={tributeAmount}
            amountUnit={commonData?.msg.payload.metadata.tributeAmountUnit}
            amount2={requestAmount}
            amount2Unit={commonData?.msg.payload.metadata.requestAmountUnit}
          />
        );
      default:
        return null;
    }
  }

  /**
   * Render
   */

  if (!commonData) {
    return null;
  }

  return (
    <>
      <div className="proposaldetails__header">Proposal Details</div>
      <div className="proposaldetails">
        {/* PROPOSAL NAME (address) AND BODY */}
        <div className="proposaldetails__content">
          <h3>{truncateEthAddress(commonData.msg.payload.name || '', 7)}</h3>

          <p>{commonData.msg.payload.body}</p>
        </div>

        {/* SIDEBAR */}
        <div className="proposaldetails__status">
          {/* AMOUNT(S) FOR RELEVANT PROPOSALS */}
          <div className="proposaldetails__amount">
            {/* @todo use value(s) from proposal.subgraphproposal depending on the adapter */}
            {showAmountBadge && renderProposalAmount()}
          </div>

          {/* SPONSOR & VOTING ACTIONS */}
          {renderActions({proposal})}
        </div>
      </div>
    </>
  );
}
