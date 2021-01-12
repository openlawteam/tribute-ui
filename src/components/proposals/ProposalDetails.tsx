import {FakeProposal} from './_mockData';
import VotingStatus from './VotingStatus';
import ProposalAmount from './ProposalAmount';

type RenderActionsArgs = {
  proposal: FakeProposal;
};

type ProposalDetailsProps = {
  proposal: FakeProposal;
  name: string;
  /**
   * A render prop to render any action button flows for a proposal.
   *
   */
  renderActions: (p: RenderActionsArgs) => React.ReactNode;
  showAmountBadge?: boolean;
};

export default function ProposalDetails(props: ProposalDetailsProps) {
  const {proposal, name, renderActions, showAmountBadge = false} = props;

  /**
   * Render
   */

  return (
    <>
      <div className="proposaldetails__header">Proposal Details</div>
      <div className="proposaldetails">
        {/* LEFT COLUMN */}

        {/* PROPOSAL NAME AND BODY */}
        <div className="proposaldetails__content">
          <h3>{name}</h3>
          <p>{proposal.snapshotProposal.body}</p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="proposaldetails__status">
          {/* ETH AMOUNT FOR TRANSER AND TRIBUTE PROPOSALS */}
          {showAmountBadge && (
            <div className="proposaldetails__amount">
              <ProposalAmount />
            </div>
          )}

          {/* VOTING PROGRESS STATUS AND BAR */}
          <VotingStatus proposal={proposal} />

          {/* SPONSOR & VOTING ACTIONS */}
          {renderActions({proposal})}
        </div>
      </div>
    </>
  );
}
