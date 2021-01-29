import {FakeProposal} from './_mockData';
import VotingStatus from './VotingStatus';

type ProposalCardProps = {
  buttonText?: string;
  onClick: (proposalHash: string) => void;
  proposal: FakeProposal; // placeholder prop
  name: string;
};

/**
 * Shows a preview of a proposal's details
 *
 * @param {ProposalCardProps} props
 * @returns {JSX.Element}
 */
export default function ProposalCard(props: ProposalCardProps): JSX.Element {
  const {buttonText = 'View Proposal', proposal, onClick, name} = props;

  /**
   * Functions
   */

  function handleClick() {
    const proposalHash = proposal.snapshotProposal.hash;

    onClick(proposalHash);
  }

  /**
   * Render
   */

  return (
    <div className="proposalcard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="proposalcard__title">{name}</h3>

      {/* VOTING PROGRESS STATUS AND BAR */}
      {/* @todo fix */}
      <VotingStatus proposal={proposal as any} />

      {/* BUTTON (no click handler) */}
      <button className="proposalcard__button">{buttonText}</button>
    </div>
  );
}
