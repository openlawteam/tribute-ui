import {OffchainVotingStatus} from './voting';
import {ProposalData} from './types';

type ProposalCardProps = {
  buttonText?: string;
  onClick: (proposalHash: string) => void;
  proposal: ProposalData;
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
    const proposalHash =
      proposal.snapshotProposal?.idInDAO || proposal.snapshotDraft?.idInDAO;

    proposalHash && onClick(proposalHash);
  }

  /**
   * Render
   */

  return (
    <div className="proposalcard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="proposalcard__title">{name}</h3>

      {/**
       * @todo Should change status component based on voting adapter
       *   It's currently not possible to get the voting adapter used for a DAO proposal,
       *   so until then we need to use the currently registered voting adapter for the DAO.
       */}
      {/* VOTING PROGRESS STATUS AND BAR */}
      <OffchainVotingStatus proposal={proposal} />

      {/* BUTTON (no click handler) */}
      <button className="proposalcard__button">{buttonText}</button>
    </div>
  );
}
