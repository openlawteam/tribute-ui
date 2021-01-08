type ProposalCardProps = {
  name: string;
  shouldRenderVerbose?: boolean;
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

  const {name, shouldRenderVerbose = true} = props;

  /**
   * Render
   */

  return <div>{name}</div>;
}
