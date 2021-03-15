import {Member} from './types';

type MemberCardProps = {
  member: Member;
  name: string;
  onClick: (ethereumAddress: string) => void;
};

/**
 * Shows a preview of a members's profile
 *
 * @param {MemberCardProps} props
 * @returns {JSX.Element}
 */
export default function MemberCard(props: MemberCardProps): JSX.Element {
  const {member, name, onClick} = props;

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
    <div className="membercard" onClick={handleClick}>
      {/* TITLE */}
      <h3 className="membercard__title">{name}</h3>
    </div>
  );
}
