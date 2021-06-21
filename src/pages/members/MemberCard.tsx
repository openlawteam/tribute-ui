import {Member} from './types';

import {truncateEthAddress} from '../../util/helpers';
import {useWeb3Modal} from '../../components/web3/hooks';

type MemberCardProps = {
  member: Member;
  onClick: (ethereumAddress: string) => void;
};

/**
 * Shows a preview of a members's profile
 *
 * @param {MemberCardProps} props
 * @returns {JSX.Element}
 */
export default function MemberCard(props: MemberCardProps): JSX.Element {
  const {member, onClick} = props;

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();

  /**
   * Functions
   */

  function handleClick() {
    const ethereumAddress = member.address;

    onClick(ethereumAddress);
  }

  /**
   * Render
   */

  return (
    <div
      className={`membercard ${
        account && account.toLowerCase() === member.address.toLowerCase()
          ? `membercard--connected-account`
          : ''
      }`}
      onClick={handleClick}>
      {/* TITLE */}
      <h3 className="membercard__title">
        {truncateEthAddress(member.address, 7)}
      </h3>
    </div>
  );
}
