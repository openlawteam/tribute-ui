import {Link} from 'react-router-dom';
import {Member} from './types';

import {truncateEthAddress} from '../../util/helpers';
import {useWeb3Modal} from '../../components/web3/hooks';

type MemberCardProps = {
  member: Member;
  to?: string;
};

const DEFAULT_CARD_LINK: string = '#';

/**
 * Shows a preview of a members's profile
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
   * Render
   */

  return (
    <Link className={'membercard__link'} to={to}>
      <div
        className={`membercard ${
          account && account.toLowerCase() === member.address.toLowerCase()
            ? `membercard--connected-account`
            : ''
        }`}>
        {/* TITLE */}
        <h3 className="membercard__title">
          {truncateEthAddress(member.address, 7)}
        </h3>
      </div>
    </Link>
  );
}
