import {AsyncStatus} from '../../util/types';
import {Member} from './types';
import {useIsDefaultChain} from '../../components/web3/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import MemberCard from './MemberCard';
import useMembers from './hooks/useMembers';
import Wrap from '../../components/common/Wrap';

export default function Members() {
  /**
   * Our hooks
   */

  const {members, membersError, membersStatus} = useMembers();
  const {defaultChainError} = useIsDefaultChain();

  /**
   * Variables
   */

  const isLoading: boolean =
    membersStatus === AsyncStatus.STANDBY ||
    membersStatus === AsyncStatus.PENDING;

  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;

  const error: Error | undefined = membersError || defaultChainError;

  /**
   * Functions
   */

  function renderMemberCards(members: Member[]) {
    return members.map((member) => {
      return (
        <MemberCard
          key={member.address}
          to={`/members/${member.address}`}
          member={member}
        />
      );
    });
  }

  /**
   * Render
   */

  // Render loading
  if (isLoading && !error) {
    return (
      <RenderWrapper>
        <div className="loader--large-container">
          <LoaderLarge />
        </div>
      </RenderWrapper>
    );
  }

  // Render error
  if (error) {
    return (
      <RenderWrapper>
        <div className="text-center">
          <ErrorMessageWithDetails
            error={error}
            renderText="Something went wrong while getting the members."
          />
        </div>
      </RenderWrapper>
    );
  }

  // Render no members
  if (!Object.values(members).length && isLoadingDone) {
    return (
      <RenderWrapper>
        <p className="text-center">No members, yet!</p>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <div className="grid--fluid grid-container">
        {/* ACTIVE MEMBERS */}
        <div>
          <div className="grid__header">Active Members</div>
          <div className="grid__cards">{renderMemberCards(members)}</div>
        </div>
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
