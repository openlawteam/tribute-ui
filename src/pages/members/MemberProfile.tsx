import {useEffect, useState} from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {AsyncStatus} from '../../util/types';
import {Member} from './types';
import {
  truncateEthAddress,
  normalizeString,
  formatNumber,
} from '../../util/helpers';
import {useIsDefaultChain, useWeb3Modal} from '../../components/web3/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import NotFound from '../subpages/NotFound';
import useMembers from './hooks/useMembers';
import Wrap from '../../components/common/Wrap';
import {useDaoTokenDetails} from '../../components/dao-token/hooks';
import DaoToken from '../../components/dao-token/DaoToken';

export default function MemberProfile() {
  /**
   * Our hooks
   */

  const {members, membersError, membersStatus} = useMembers();
  const {defaultChainError} = useIsDefaultChain();
  const {account} = useWeb3Modal();
  const {daoTokenDetails, daoTokenDetailsStatus} = useDaoTokenDetails();

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
    membersStatus === AsyncStatus.PENDING ||
    daoTokenDetailsStatus === AsyncStatus.STANDBY ||
    daoTokenDetailsStatus === AsyncStatus.PENDING;
  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;
  const error: Error | undefined = membersError || defaultChainError;
  const isCurrentMemberConnected: boolean =
    account &&
    memberDetails &&
    normalizeString(account) === normalizeString(memberDetails?.address)
      ? true
      : false;

  /**
   * Functions
   */

  function renderMemberInfo() {
    if (!memberDetails) return;

    return (
      <div>
        <div className="memberprofile__info-item">
          {daoTokenDetails ? (
            <>
              <span>Dao Tokens</span>
              <span>{`${formatNumber(memberDetails.units)} ${
                daoTokenDetails.symbol || 'tokens'
              }`}</span>
              {isCurrentMemberConnected && (
                <small>
                  <DaoToken daoTokenDetails={daoTokenDetails} />
                </small>
              )}
            </>
          ) : (
            <>
              <span>Membership Units</span>
              <span>{formatNumber(memberDetails.units)}</span>
            </>
          )}
        </div>
        <div className="memberprofile__info-item">
          <span>Voting Weight</span>
          <span>TODO%</span>
        </div>
      </div>
    );
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

            <div className="memberprofile__left-column">
              {/* MEMBER ADDRESS */}
              <h3>{truncateEthAddress(memberDetails.address, 7)}</h3>

              {/* MEMBER INFO */}
              {renderMemberInfo()}
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
