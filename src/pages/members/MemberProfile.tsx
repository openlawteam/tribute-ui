import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {useHistory, useParams} from 'react-router-dom';

import {useIsDefaultChain, useWeb3Modal} from '../../components/web3/hooks';
import {StoreState} from '../../store/types';
import {AsyncStatus} from '../../util/types';
import {CopyWithTooltip} from '../../components/common/CopyWithTooltip';
import {formatNumber, normalizeString} from '../../util/helpers';
import {Member} from './types';
import {useDaoTokenDetails} from '../../components/dao-token/hooks';
import {useDaoTotalUnits} from '../../hooks';
import DaoToken from '../../components/dao-token/DaoToken';
import Delegation from './Delegation';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import LoaderLarge from '../../components/feedback/LoaderLarge';
import useMembers from './hooks/useMembers';
import Wrap from '../../components/common/Wrap';

export default function MemberProfile() {
  /**
   * Selectors
   */

  const ERC20ExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.ERC20ExtensionContract
  );

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();
  const {daoTokenDetails, daoTokenDetailsStatus} = useDaoTokenDetails();
  const {defaultChainError} = useIsDefaultChain();
  const {members, membersError, membersStatus} = useMembers();
  const {totalUnitsIssued, totalUnitsStatus} = useDaoTotalUnits();

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

  // Set member details
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

  const error: Error | undefined = membersError || defaultChainError;
  const isLoadingDone: boolean = membersStatus === AsyncStatus.FULFILLED;

  const ensNameFound: boolean =
    memberDetails?.addressENS &&
    normalizeString(memberDetails?.addressENS) !==
      normalizeString(memberDetails?.address)
      ? true
      : false;

  const isLoading: boolean =
    membersStatus === AsyncStatus.STANDBY ||
    membersStatus === AsyncStatus.PENDING ||
    (ERC20ExtensionContract && daoTokenDetailsStatus === AsyncStatus.STANDBY) ||
    daoTokenDetailsStatus === AsyncStatus.PENDING ||
    totalUnitsStatus === AsyncStatus.STANDBY ||
    totalUnitsStatus === AsyncStatus.PENDING;

  const isCurrentMemberConnected: boolean =
    account &&
    memberDetails &&
    normalizeString(account) === normalizeString(memberDetails.address)
      ? true
      : false;

  const votingWeight =
    memberDetails && typeof totalUnitsIssued === 'number'
      ? ((Number(memberDetails.units) / totalUnitsIssued) * 100).toFixed(2)
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
              <CopyWithTooltip
                render={({elementRef, isCopied, setCopied, tooltipID}) => (
                  <h3 onClick={setCopied}>
                    <span
                      data-for={tooltipID}
                      data-tip={
                        isCopied
                          ? 'copied!'
                          : ensNameFound
                          ? `${memberDetails.addressENS} (${memberDetails.address})`
                          : 'copy'
                      }
                      ref={elementRef}>
                      {memberDetails.addressENS || memberDetails.address}
                    </span>
                  </h3>
                )}
                textToCopy={memberDetails.address}
              />

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
