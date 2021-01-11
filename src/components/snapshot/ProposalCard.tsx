import VotingStatus from '../../components/snapshot/VotingStatus';

type ProposalCardProps = {
  buttonText?: string;
  name: string;
  onClick: (proposalId: string) => void;
  shouldRenderVerbose?: boolean;
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

  const {
    name,
    shouldRenderVerbose = true,
    buttonText = 'View Proposal',
    snapshotProposal,
    onClick,
  } = props;

  /**
   * Functions
   */

  // @todo adjust `proposalId` to whatever is necessary for how we handle
  // proposal identifiers (e.g., hash, uuid)
  function handleClick() {
    const proposalId = name;

    onClick(proposalId);
  }

  /**
   * Render
   */

  return (
    <div className="proposalcard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="proposalcard__title">{name}</h3>

      {/* SHOW THE VOTING PROGRESS BAR & BUTTON. DEFAULTS to `true` */}
      {shouldRenderVerbose && (
        <>
          {/* STATUS */}
          <VotingStatus snapshotProposal={snapshotProposal} />

          {/* BUTTON (no click handler) */}
          <button className="proposalcard__button">{buttonText}</button>
        </>
      )}
    </div>
  );
}
