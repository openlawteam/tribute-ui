import {useRef, useEffect} from 'react';
import {toChecksumAddress} from 'web3-utils';

import {CycleEllipsis} from '../../components/feedback/CycleEllipsis';
import CycleMessage from '../../components/feedback/CycleMessage';
import EtherscanURL from '../../components/web3/EtherscanURL';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import Loader from '../../components/feedback/Loader';
import DaoToken, {
  ERC20RegisterDetails,
} from '../../components/dao-token/DaoToken';
import {useCheckApplicant} from '../../components/proposals/hooks';
import {useRedeemCoupon, FetchStatus} from '../../hooks/useRedeemCoupon';
import {useMemberActionDisabled} from '../../hooks';
import {formatNumber, truncateEthAddress} from '../../util/helpers';
import {Web3TxStatus} from '../../components/web3/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {AsyncStatus} from '../../util/types';

type RedeemManagerProps = {
  redeemables: Record<string, any>;
  daoTokenDetails?: ERC20RegisterDetails;
};

type RedeemCardProps = {
  redeemable: Record<string, any>;
  daoTokenDetails?: ERC20RegisterDetails;
};

type ActionDisabledReasons = {
  invalidApplicantMessage: string;
};

/**
 * Cached outside the component to prevent infinite re-renders.
 *
 * The same can be accomplished inside the component using
 * `useState`, `useRef`, etc., depending on the use case.
 */
const useMemberActionDisabledProps = {
  // Anyone can process a proposal - it's just a question of gas payment.
  skipIsActiveMemberCheck: true,
};

export default function RedeemManager({
  redeemables,
  daoTokenDetails,
}: RedeemManagerProps) {
  /**
   *  Render
   */

  // show the redeem card, if only one coupon available
  return (
    <RenderWrapper>
      <RedeemCard
        redeemable={redeemables[0]}
        daoTokenDetails={daoTokenDetails}
      />
    </RenderWrapper>
  );
}

function RedeemCard({redeemable, daoTokenDetails}: RedeemCardProps) {
  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    invalidApplicantMessage: '',
  });

  /**
   * Our hooks
   */

  const {
    redeemCoupon,
    submitStatus,
    submitError,
    txStatus,
    txEtherscanURL,
    txIsPromptOpen,
  } = useRedeemCoupon();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled(useMemberActionDisabledProps);

  const {
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
  } = useCheckApplicant(redeemable.recipient);

  /**
   * Variables
   */

  const isInProcess =
    submitStatus === FetchStatus.PENDING ||
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;
  const isDone =
    submitStatus === FetchStatus.FULFILLED ||
    txStatus === Web3TxStatus.FULFILLED ||
    redeemable.isRedeemd;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Effects
   */

  useEffect(() => {
    if (redeemable.recipient) {
      // 1. Determine and set reasons why action would be disabled

      // Reason: If the applicant address is invalid (see `useCheckApplicant`
      // hook for reasons) the `submitProposal` smart contract transaction will
      // fail.
      if (checkApplicantError) {
        console.warn(
          `Error checking if the applicant address '${redeemable.recipient}' is valid: ${checkApplicantError.message}`
        );
      }

      if (
        checkApplicantStatus === AsyncStatus.FULFILLED &&
        !isApplicantValid &&
        checkApplicantInvalidMsg
      ) {
        actionDisabledReasonsRef.current = {
          ...actionDisabledReasonsRef.current,
          invalidApplicantMessage: checkApplicantInvalidMsg,
        };
      }

      // 2. Set reasons
      setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
    }
  }, [
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
    redeemable.recipient,
    setOtherDisabledReasons,
  ]);

  /**
   * Functions
   */

  function renderSubmitStatus(): React.ReactNode {
    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Awaiting your confirmation
            <CycleEllipsis />
          </>
        );
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={TX_CYCLE_MESSAGES}
              useFirstItemStart
              render={(message: string) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>{'Finalized!'}</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  /**
   * Render
   */

  return (
    <>
      <div
        className={`redeemcard redeemcard__content ${
          isDone ? 'fireworks' : ''
        } `}>
        <p className="redeemcard__recipient">
          Recipient:{' '}
          {truncateEthAddress(toChecksumAddress(redeemable.recipient), 7)}
        </p>
        <p className="redeemcard__unit">
          {formatNumber(redeemable.amount)}
          <sup>
            <small>{daoTokenDetails?.symbol || 'tokens'}</small>
          </sup>
        </p>

        <DaoToken daoTokenDetails={daoTokenDetails} />

        {isDone && (
          <p className="redeemcard__redeemed">
            <span
              className="pulse"
              role="img"
              aria-label="Redeemed!"
              style={{display: 'inline-block'}}>
              🥳
            </span>
          </p>
        )}

        <button
          className="button"
          style={{marginTop: isDone ? '1rem' : '1.5rem'}}
          onClick={async () => {
            await redeemCoupon(redeemable, daoTokenDetails);
          }}
          disabled={isDisabled || isInProcessOrDone}>
          {isInProcess ? <Loader /> : isDone ? 'Redeemed!' : 'Redeem'}
        </button>

        {/* SUBMIT STATUS */}
        {isInProcessOrDone && !redeemable.isRedeemd && (
          <div
            className="form__submit-status-container"
            style={{marginTop: '1rem'}}>
            {renderSubmitStatus()}
          </div>
        )}

        {isDisabled && (
          <button
            className="button--help-centered"
            onClick={openWhyDisabledModal}
            style={{margin: '1rem auto 0'}}>
            Why is redeeming disabled?
          </button>
        )}

        {/* SUBMIT ERROR */}
        {submitError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while redeeming the coupon."
              error={submitError}
            />
          </div>
        )}
      </div>

      <WhyDisabledModal title="Why is redeeming disabled?" />
    </>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  return (
    <FadeIn>
      <div className="grid--fluid grid-container">
        {/* RENDER CHILDREN */}
        {props.children}
      </div>
    </FadeIn>
  );
}
