import {useHistory} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import MemberCard from './MemberCard';
import useMembers from './hooks/useMembers';
import {Member} from './types';
import LoaderWithEmoji from '../../components/feedback/LoaderWithEmoji';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';

export default function Members() {
  /**
   * Our hooks
   */

  const {members, membersError, membersStatus} = useMembers();

  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Variables
   */

  const isLoading: boolean =
    membersStatus === AsyncStatus.STANDBY ||
    membersStatus === AsyncStatus.PENDING;
  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;
  const isError: boolean = membersStatus === AsyncStatus.REJECTED;

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

  /**
   * Render
   */

  // Render loading

  return (
    <RenderWrapper>
      <div className="loader--emoji-container">
        <LoaderWithEmoji />
      </div>
    </RenderWrapper>
  );

  // // Render loading
  // if (isLoading && !isError) {
  //   return (
  //     <RenderWrapper>
  //       <div className="loader--emoji-container">
  //         <LoaderWithEmoji />
  //       </div>
  //     </RenderWrapper>
  //   );
  // }

  // // Render error
  // if (isError) {
  //   return (
  //     <RenderWrapper>
  //       <div className="text-center">
  //         <ErrorMessageWithDetails
  //           error={membersError}
  //           renderText="Something went wrong while getting the members."
  //         />
  //       </div>
  //     </RenderWrapper>
  //   );
  // }

  // // Render no members
  // if (!Object.values(members).length && isLoadingDone) {
  //   return (
  //     <RenderWrapper>
  //       <p className="text-center">No members, yet!</p>
  //     </RenderWrapper>
  //   );
  // }

  // return (
  //   <RenderWrapper>
  //     <div className="grid--fluid grid-container">
  //       {/* ACTIVE MEMBERS */}
  //       <div>
  //         <div className="grid__header">Active Members</div>
  //         <div className="grid__cards">{renderMemberCards(members)}</div>
  //       </div>
  //     </div>
  //   </RenderWrapper>
  // );
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
