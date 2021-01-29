import {ProposalData} from './types';
import {truncateEthAddress} from '../../util/helpers';
import ProposalAmount from './ProposalAmount';

type RenderActionsArgs = {
  proposal: ProposalData;
};

type ProposalDetailsProps = {
  proposal: ProposalData;
  /**
   * A render prop to render any action button flows for a proposal.
   */
  renderActions: (p: RenderActionsArgs) => React.ReactNode;
  /**
   * Option to change the visibility of the ETH amount. Defaults to `true`.
   */
  showAmountBadge?: boolean;
};

export default function ProposalDetails(props: ProposalDetailsProps) {
  const {proposal, renderActions, showAmountBadge = true} = props;

  const {daoProposal} = proposal;
  const commonData = proposal.getCommonSnapshotProposalData();

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
          {/* ETH AMOUNT FOR TRANSER AND TRIBUTE PROPOSALS */}
          <div className="proposaldetails__amount">
            {/* @todo use value from proposal.subgraphproposal.amount, or do not show if no `.amount` key */}
            {showAmountBadge && <ProposalAmount amount={daoProposal?.amount} />}
          </div>

          {/* SPONSOR & VOTING ACTIONS */}
          {renderActions({proposal})}
        </div>
      </div>
    </>
  );
}
