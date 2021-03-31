import {ProposalData} from './types';

import {truncateEthAddress} from '../../util/helpers';
import Markdown from 'markdown-to-jsx';

type ProposalDetailsProps = {
  proposal: ProposalData;
  /**
   * A render prop to render amount(s) badge.
   */
  renderAmountBadge?: () => React.ReactNode;
  /**
   * A render prop to render any action button flows for a proposal.
   */
  renderActions: () => React.ReactNode;
};

export default function ProposalDetails(props: ProposalDetailsProps) {
  const {proposal, renderAmountBadge, renderActions} = props;

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
        {/* PROPOSAL NAME (an address in most cases) AND BODY */}
        <div className="proposaldetails__content">
          <h3>
            {/* @note If the proposal title is not an address it will fall back to a normal, non-truncated string. */}
            {truncateEthAddress(commonData.msg.payload.name || '', 7)}
          </h3>

          <Markdown>{commonData.msg.payload.body}</Markdown>
        </div>

        {/* SIDEBAR */}
        <div className="proposaldetails__status">
          {/* AMOUNT(S) IF RELEVANT FOR PROPOSAL */}
          {renderAmountBadge && renderAmountBadge()}

          {/* SPONSOR & VOTING ACTIONS */}
          {renderActions()}
        </div>
      </div>
    </>
  );
}
