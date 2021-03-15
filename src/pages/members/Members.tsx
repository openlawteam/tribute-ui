import {useHistory} from 'react-router-dom';

import {truncateEthAddress} from '../../util/helpers';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import MemberCard from './MemberCard';
import useMembers from './hooks/useMembers';
import {Member} from './types';

export default function Members() {
  /**
   * Our hooks
   */

  const {members} = useMembers();

  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Cached callbacks
   */

  /**
   * Effects
   */

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
          name={truncateEthAddress(member.address, 7)}
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

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <div className="grid--fluid grid-container">
        {/* ACTIVE MEMBERS */}
        <>
          <div className="grid__header">Active Members</div>
          <div className="grid__cards">
            {members && renderMemberCards(members)}
          </div>
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
