import {Link} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {formatNumber, normalizeString} from '../../util/helpers';
import {Member} from './types';
import {useRef} from 'react';
import {useWeb3Modal} from '../../components/web3/hooks';
import ReactTooltip from 'react-tooltip';

type MemberCardProps = {
  member: Member;
  to?: string;
};

const DEFAULT_CARD_LINK: string = '#';
const TOOLTIP_DELAY: number = 200;

/**
 * Shows a preview of a member's profile
 *
 * @param {MemberCardProps} props
 * @returns {JSX.Element}
 */
export default function MemberCard(props: MemberCardProps): JSX.Element {
  const {member, to = DEFAULT_CARD_LINK} = props;

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();

  /**
   * Refs
   */

  const titleTooltipIDRef = useRef<string>(uuidv4());
  const unitsTooltipIDRef = useRef<string>(uuidv4());

  /**
   * Variables
   */

  const {units} = member;
  const unitsFormatted: string = formatNumber(units);

  const ensNameFound: boolean =
    member?.addressENS &&
    normalizeString(member?.addressENS) !== normalizeString(member?.address)
      ? true
      : false;

  /**
   * Render
   */

  return (
    <Link className={'membercard__link'} to={to}>
      <div
        className={`membercard ${
          account &&
          normalizeString(account) === normalizeString(member.address)
            ? `membercard--connected-account`
            : ''
        }`}>
        {/* TITLE */}
        <h3
          className="membercard__title"
          data-for={titleTooltipIDRef.current}
          data-tip={
            ensNameFound
              ? `${member.addressENS} (${member.address})`
              : member.address
          }>
          {member?.addressENS || member.address}
        </h3>

        <ReactTooltip
          delayShow={TOOLTIP_DELAY}
          effect="solid"
          id={titleTooltipIDRef.current}
        />

        {/* UNITS */}
        <span
          className="membercard__units"
          data-for={unitsTooltipIDRef.current}
          data-tip={`${unitsFormatted} unit${Number(units) === 1 ? '' : 's'}`}>
          {unitsFormatted}
        </span>

        <ReactTooltip
          delayShow={TOOLTIP_DELAY}
          effect="solid"
          id={unitsTooltipIDRef.current}
        />
      </div>
    </Link>
  );
}
