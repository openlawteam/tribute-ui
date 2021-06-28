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
import useMembers from './hooks/useMembers';
import Wrap from '../../components/common/Wrap';
import {useDaoTokenDetails} from '../../components/dao-token/hooks';
import DaoToken from '../../components/dao-token/DaoToken';
import {useDaoTotalUnits} from '../../hooks';
import Delegation from './Delegation';

export default function MemberProfile() {
  /**
   * Our hooks
   */

  const {members, membersError, membersStatus} = useMembers();
  const {defaultChainError} = useIsDefaultChain();
  const {account} = useWeb3Modal();
  const {daoTokenDetails, daoTokenDetailsStatus} = useDaoTokenDetails();
  const {totalUnits, totalUnitsStatus} = useDaoTotalUnits();

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
    daoTokenDetailsStatus === AsyncStatus.PENDING ||
    totalUnitsStatus === AsyncStatus.STANDBY ||
    totalUnitsStatus === AsyncStatus.PENDING;
  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;
  const error: Error | undefined = membersError || defaultChainError;
  const isCurrentMemberConnected: boolean =
    account &&
    memberDetails &&
    normalizeString(account) === normalizeString(memberDetails.address)
      ? true
      : false;
  const votingWeight =
    memberDetails && typeof totalUnits === 'number'
      ? ((Number(memberDetails.units) / totalUnits) * 100).toFixed(2)
      : '';

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
              <div>DAO Tokens</div>
              <div>{`${formatNumber(memberDetails.units)} ${
                daoTokenDetails.symbol || 'tokens'
              }`}</div>
              {isCurrentMemberConnected && (
                <small>
                  <DaoToken daoTokenDetails={daoTokenDetails} />
                </small>
              )}
            </>
          ) : (
            <>
              <div>Membership Units</div>
              <div>{formatNumber(memberDetails.units)}</div>
            </>
          )}
        </div>
        <div className="memberprofile__info-item">
          <div>Voting Weight</div>
          <div>{`${votingWeight}%`}</div>
        </div>
      </div>
    );
  }

  function renderMemberActions() {
    if (isCurrentMemberConnected) {
      return (
        <div>
          <div className="memberprofile__action">
            <div className="memberprofile__action-header">Delegation</div>
            <Delegation />
          </div>
        </div>
      );
    } else {
      return (
        <div className="memberprofile__actions-unavailable">
          Connect your wallet with this member address to view available
          actions.
        </div>
      );
    }
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

  // Render no member found
  if (memberNotFound && isLoadingDone) {
    return (
      <RenderWrapper>
        <div className="text-center error-message">
          <p>Member not found.</p>
        </div>
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
              {/* MEMBER ACTIONS */}
              {renderMemberActions()}
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
