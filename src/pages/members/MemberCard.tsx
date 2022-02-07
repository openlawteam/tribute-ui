import {Link} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {
  formatNumber,
  formatNumberAbbreviated,
  normalizeString,
} from '../../util/helpers';
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

  const ensTooltipIDRef = useRef<string>(uuidv4());
  const titleTooltipIDRef = useRef<string>(uuidv4());
  const unitsTooltipIDRef = useRef<string>(uuidv4());

  /**
   * Variables
   */

  const {units} = member;
  const unitAbbreviated: string = formatNumberAbbreviated(Number(units));
  const unitsFormatted: string = formatNumber(units);

  const ensNameFound: boolean =
    member?.addressENS &&
    normalizeString(member?.addressENS) !== normalizeString(member?.address)
      ? true
      : false;

  const addressTooltipText: string = ensNameFound
    ? `${member.addressENS} (${member.address})`
    : member.address;

  /**
   * Render
   */

  return (
    <Link className={'membercard__link'} to={to}>
      <div
        className={`membercard ${
          account &&
          (normalizeString(account) === normalizeString(member.address) ||
            normalizeString(account) === normalizeString(member.delegateKey))
            ? `membercard--connected-account`
            : ''
        }`}>
        {/* ROW 1 */}
        <div className="membercard__row">
          {/* TITLE */}
          <h3
            className="membercard__title"
            data-for={titleTooltipIDRef.current}
            data-tip={addressTooltipText}>
            {member.address}
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
            data-tip={`${unitsFormatted} unit${
              Number(units) === 1 ? '' : 's'
            }`}>
            {unitAbbreviated}
          </span>

          <ReactTooltip
            delayShow={TOOLTIP_DELAY}
            effect="solid"
            id={unitsTooltipIDRef.current}
          />
        </div>

        {/* ROW 2 */}
        {ensNameFound && member?.addressENS && (
          <div className="membercard__row">
            {/* ENS */}
            <span
              className="membercard__ens"
              data-for={ensTooltipIDRef.current}
              data-tip={addressTooltipText}>
              {member?.addressENS}
            </span>

            <ReactTooltip
              delayShow={TOOLTIP_DELAY}
              effect="solid"
              id={ensTooltipIDRef.current}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
