import {Link} from 'react-router-dom';
import {v4 as uuidv4} from 'uuid';

import {Member} from './types';
import {normalizeString} from '../../util/helpers';
import {useRef} from 'react';
import {useWeb3Modal} from '../../components/web3/hooks';
import ReactTooltip from 'react-tooltip';

type MemberCardProps = {
  member: Member;
  to?: string;
};

const DEFAULT_CARD_LINK: string = '#';

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

  const tooltipIDRef = useRef<string>(uuidv4());

  /**
   * Variables
   */

  const ensNameFound: boolean =
    member?.addressENS !== undefined &&
    member?.addressENS !== null &&
    member?.addressENS !== '' &&
    normalizeString(member?.addressENS) !== normalizeString(member?.address);

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
          data-for={tooltipIDRef.current}
          data-tip={
            ensNameFound
              ? `${member.addressENS} (${member.address})`
              : member.address
          }>
          {member?.addressENS || member.address}
        </h3>

        <ReactTooltip
          delayShow={200}
          effect="solid"
          id={tooltipIDRef.current}
        />
      </div>
    </Link>
  );
}
