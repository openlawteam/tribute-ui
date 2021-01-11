import {truncateEthAddress} from '../../util/helpers';
import VotingStatus from '../../components/snapshot/VotingStatus';

type ProposalCardProps = {
  buttonText?: string;
  onClick: (proposalHash: string) => void;
  snapshotProposal?: any; // placeholder prop
};

/**
 * Shows a preview of a proposal's details
 *
 * @param {ProposalCardProps} props
 * @returns {JSX.Element}
 */
export default function ProposalCard(props: ProposalCardProps): JSX.Element {
  /**
   * Variables
   */

  const {buttonText = 'View Proposal', snapshotProposal, onClick} = props;

  /**
   * Functions
   */

  function handleClick() {
    const proposalHash = snapshotProposal.hash;

    onClick(proposalHash);
  }

  /**
   * Render
   */

  return (
    <div className="proposalcard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="proposalcard__title">
        {truncateEthAddress(snapshotProposal.name, 7)}
      </h3>

      {/* VOTING PROGRESS STATUS AND BAR */}
      <VotingStatus snapshotProposal={snapshotProposal} />

      {/* BUTTON (no click handler) */}
      <button className="proposalcard__button">{buttonText}</button>
    </div>
  );
}
