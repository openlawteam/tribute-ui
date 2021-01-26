import {
  SnapshotProposalResponseData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {ProposalCombined, ProposalOrDraftSnapshotData} from './types';
import {truncateEthAddress} from '../../util/helpers';
import ProposalAmount from './ProposalAmount';
import VotingStatus from './VotingStatus';

type RenderActionsArgs<T extends ProposalOrDraftSnapshotData> = {
  proposal: ProposalCombined<T>;
};

type ProposalDetailsProps<T extends ProposalOrDraftSnapshotData> = {
  proposal: ProposalCombined<T>;
  /**
   * A render prop to render any action button flows for a proposal.
   */
  renderActions: (p: RenderActionsArgs<T>) => React.ReactNode;
  /**
   * Option to change the visibility of the ETH amount. Defaults to `true`.
   */
  showAmountBadge?: boolean;
};

export default function ProposalDetails<T extends ProposalOrDraftSnapshotData>(
  props: ProposalDetailsProps<T>
) {
  const {proposal, renderActions, showAmountBadge = true} = props;

  /**
   * Variables
   */

  const isProposalType: boolean =
    proposal.snapshotProposal.msg.type === SnapshotType.proposal;

  /**
   * Render
   */

  return (
    <>
      <div className="proposaldetails__header">Proposal Details</div>
      <div className="proposaldetails">
        {/* PROPOSAL NAME (address) AND BODY */}
        <div className="proposaldetails__content">
          <h3>
            {truncateEthAddress(proposal.snapshotProposal.msg.payload.name, 7)}
          </h3>

          <p>{proposal.snapshotProposal.msg.payload.body}</p>
        </div>

        {/* SIDEBAR */}
        <div className="proposaldetails__status">
          {/* ETH AMOUNT FOR TRANSER AND TRIBUTE PROPOSALS */}
          <div className="proposaldetails__amount">
            {/* @todo use value from proposal.subgraphproposal.amount, or do not show if no `.amount` key */}
            {showAmountBadge && (
              /* proposal.subgraphProposal.amount */ <ProposalAmount amount="100000000000000000000" />
            )}
          </div>

          {/* VOTING PROGRESS STATUS AND BAR */}
          {isProposalType && (
            <VotingStatus
              proposal={
                proposal as ProposalCombined<SnapshotProposalResponseData>
              }
            />
          )}

          {/* SPONSOR & VOTING ACTIONS */}
          {renderActions({proposal})}
        </div>
      </div>
    </>
  );
}
