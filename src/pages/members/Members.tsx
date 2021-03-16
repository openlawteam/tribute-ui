import {useHistory} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import MemberCard from './MemberCard';
import useMembers from './hooks/useMembers';
import {Member} from './types';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';

export default function Members() {
  /**
   * Our hooks
   */

  const {members, membersStatus} = useMembers();

  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function renderMemberCards(members: Member[]) {
    return members.map((member) => {
      return (
        <MemberCard
          key={member.address}
          onClick={handleClickMemberProfile(member.address)}
          member={member}
        />
      );
    });
  }

  function handleClickMemberProfile(ethereumAddress: string) {
    return () => {
      if (!ethereumAddress) return;

      history.push(`/members/${ethereumAddress}`);
    };
  }

  function renderMembersContent() {
    if (membersStatus === AsyncStatus.PENDING) {
      return (
        <div className="loader--emjoi-container">
          <LoaderWithEmoji showAfterMs={300} />
        </div>
      );
    }

    if (membersStatus === AsyncStatus.REJECTED) {
      return (
        <div className="text-center">
          <p className="error-message">
            The list of members could not be retrieved.
          </p>
        </div>
      );
    }

    if (members && membersStatus === AsyncStatus.FULFILLED) {
      if (members.length > 0) {
        return <div className="grid__cards">{renderMemberCards(members)}</div>;
      } else {
        return <p>No members, yet.</p>;
      }
    }
  }

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div className="grid--fluid grid-container">
        {/* ACTIVE MEMBERS */}
        <>
          <div className="grid__header">Active Members</div>
          {renderMembersContent()}
        </>
      </div>
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Members</h2>
        </div>
        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
