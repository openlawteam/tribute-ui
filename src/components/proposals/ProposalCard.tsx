import LinesEllipsis from 'react-lines-ellipsis';
import responsiveHOC from 'react-lines-ellipsis/lib/responsiveHOC';

import {isEthAddressValid} from '../../util/validation';
import {truncateEthAddress} from '../../util/helpers';

type ProposalCardProps = {
  buttonText?: string;
  onClick: (proposalOnClickId: string) => void;
  /**
   * The ID for the proposal to be used for navigation.
   * As there can be a few different options, it's best to provide it
   * explicitly.
   */
  proposalOnClickId: string;
  name: string;
  /**
   * Render a custom status via render prop
   */
  renderStatus?: () => React.ReactNode;
};

const DEFAULT_BUTTON_TEXT: string = 'View Proposal';

const ResponsiveEllipsis = responsiveHOC()(LinesEllipsis);

/**
 * Shows a preview of a proposal's details
 *
 * @param {ProposalCardProps} props
 * @returns {JSX.Element}
 */
export default function ProposalCard(props: ProposalCardProps): JSX.Element {
  const {
    buttonText = DEFAULT_BUTTON_TEXT,
    proposalOnClickId,
    onClick,
    name,
    renderStatus,
  } = props;

  /**
   * Functions
   */

  function handleClick() {
    onClick(proposalOnClickId);
  }

  function renderName(name: string) {
    if (isEthAddressValid(name)) {
      return truncateEthAddress(name, 7);
    } else {
      return (
        <ResponsiveEllipsis
          text={name}
          maxLine={1}
          ellipsis="..."
          trimRight
          basedOn="letters"
        />
      );
    }
  }

  /**
   * Render
   */

  return (
    <div className="proposalcard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="proposalcard__title">{renderName(name)}</h3>

      {/* E.G. VOTING PROGRESS STATUS AND BAR */}
      {renderStatus && renderStatus()}

      {/* BUTTON (no click handler) */}
      <button className="proposalcard__button">
        {buttonText || DEFAULT_BUTTON_TEXT}
      </button>
    </div>
  );
}
