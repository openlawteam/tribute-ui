import {useEffect, useState} from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import {truncateEthAddress, normalizeString} from '../../util/helpers';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import NotFound from '../subpages/NotFound';
import useMembers from './hooks/useMembers';
import {Member} from './types';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';

export default function MemberProfile() {
  /**
   * Our hooks
   */

  const {members, membersError, membersStatus} = useMembers();

  /**
   * Their hooks
   */

  // Get ethereumAddress for fetching the member.
  const {ethereumAddress} = useParams<{ethereumAddress: string}>();

  /**
   * State
   */

  const [memberDetails, setMemberDetails] = useState<Member>();
  const [memberNotFound, setMemberNotFound] = useState<boolean>(false);

  /**
   * Effects
   */

  useEffect(() => {
    if (membersStatus !== AsyncStatus.FULFILLED) return;

    const activeMember = members.find(
      (member) =>
        normalizeString(member.address) === normalizeString(ethereumAddress)
    );

    setMemberDetails(activeMember);
    if (!activeMember) {
      setMemberNotFound(true);
    }
  }, [ethereumAddress, members, membersStatus]);

  /**
   * Variables
   */

  const isLoading: boolean =
    membersStatus === AsyncStatus.STANDBY ||
    membersStatus === AsyncStatus.PENDING;
  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;
  const isError: boolean = membersStatus === AsyncStatus.REJECTED;

  /**
   * Render
   */

  // Render loading
  if (isLoading && !isError) {
    return (
      <RenderWrapper>
        <div className="loader--large-container">
          <LoaderLarge />
        </div>
      </RenderWrapper>
    );
  }

  // Render error
  if (isError) {
    return (
      <RenderWrapper>
        <div className="text-center">
          <ErrorMessageWithDetails
            error={membersError}
            renderText="Something went wrong while getting the member."
          />
        </div>
      </RenderWrapper>
    );
  }

  // Render 404 no member found
  if (memberNotFound && isLoadingDone) {
    return (
      <RenderWrapper>
        <NotFound />
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      {memberDetails ? (
        <>
          <div className="memberprofile__header">Member Profile</div>
          <div className="proposaldetails">
            {/* LEFT COLUMN */}

            {/* MEMBER ADDRESS */}
            <div className="memberprofile__left-column">
              <h3>{truncateEthAddress(memberDetails.address, 7)}</h3>
              <div>MemberProfile Info @todo</div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="memberprofile__right-column">
              MemberProfile Actions @todo
            </div>
          </div>
        </>
      ) : (
        // Render nothing. Should never reach this case.
        <></>
      )}
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function viewAll(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    history.push('/members');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Members</h2>
          <button className="titlebar__action" onClick={viewAll}>
            View all
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
