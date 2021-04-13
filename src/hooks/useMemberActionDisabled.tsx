import React, {useCallback, useState} from 'react';
import ReactModal from 'react-modal';

import {StoreState} from '../store/types';
import {useSelector} from 'react-redux';
import {useWeb3Modal} from '../components/web3/hooks';
import FadeIn from '../components/common/FadeIn';
import TimesSVG from '../assets/svg/TimesSVG';

/**
 * Props should be cached somehow to prevent a new object
 * making the hook re-render each time the parent re-renders,
 * causing a continuous loop.
 */
type UseMemberActionDisabledProps = {
  /**
   * Allows the active member check to be skipped.
   * e.g. A tx does not require the account to be a member.
   */
  skipIsActiveMemberCheck?: boolean;
};

type UseMemberActionDisabledReturn = {
  disabledReason: string;
  isDisabled: boolean;
  openWhyDisabledModal: () => void;
  setOtherDisabledReasons: (r: string[]) => void;
  WhyDisabledModal: (p: WhyDisabledModalProps) => JSX.Element | null;
};

type WhyDisabledModalProps = {
  title?: string;
};

/**
 * useMemberActionDisabled
 *
 * This component covers the most common cases for why a member action button should be disabled.
 * More reasons for disabling the button can be added via props using `setOtherDisabledReasons`.
 *
 * @param {ProposalActionWhyDisabledProps} props
 * @returns {UseMemberActionDisabledReturn}
 */
export function useMemberActionDisabled(
  props?: UseMemberActionDisabledProps
): UseMemberActionDisabledReturn {
  const {skipIsActiveMemberCheck = false} = props || {};

  /**
   * State
   */

  const [otherDisabledReasons, setOtherDisabledReasons] = useState<string[]>(
    []
  );
  const [shouldShowWhyModal, setShouldShowWhyModal] = useState<boolean>(false);

  /**
   * Selectors
   */

  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  /**
   * Our hooks
   */

  const {connected} = useWeb3Modal();

  /**
   * Variables
   */

  // Get the first index of other reasons.
  const otherReasonNext =
    otherDisabledReasons && otherDisabledReasons.find((r) => r);
  const disabledReason = getDisabledReason();
  const isDisabled =
    (disabledReason ? true : false) || (otherReasonNext ? true : false);
  const canShowDisabledReason = isDisabled && disabledReason ? true : false;

  /**
   * Cached callbacks
   */

  const WhyDisabledModalCached = useCallback(WhyDisabledModal, [
    canShowDisabledReason,
    disabledReason,
    shouldShowWhyModal,
  ]);

  const handleSetOtherDisabledReasonsCached = useCallback(
    handleSetOtherDisabledReasons,
    []
  );

  /**
   * Functions
   */

  function handleSetOtherDisabledReasons(otherReasons: string[]) {
    setOtherDisabledReasons(otherReasons.filter(Boolean));
  }

  function getDisabledReason() {
    if (!connected) {
      return 'Your wallet is not connected.';
    }

    if (!isActiveMember && !skipIsActiveMemberCheck) {
      return 'Either you are not a member, or your membership is not active.';
    }

    return otherReasonNext || '';
  }

  function handleOpenWhyDisabledModal() {
    setShouldShowWhyModal(true);
  }

  function WhyDisabledModal(props: WhyDisabledModalProps): JSX.Element | null {
    if (!canShowDisabledReason) return null;

    const {title} = props;

    return (
      <ReactModal
        ariaHideApp={false}
        className="modal-container"
        isOpen={shouldShowWhyModal}
        onRequestClose={() => {
          setShouldShowWhyModal(false);
        }}
        overlayClassName="modal-overlay"
        role="dialog"
        style={{overlay: {zIndex: 1000}}}>
        <FadeIn>
          <div className="modal">
            <button
              className="modal__close-button modal__close-button--icon"
              onClick={() => {
                setShouldShowWhyModal(false);
              }}>
              <TimesSVG />
            </button>
            <div className="card">
              <h2 className="modal__title">{title || 'Why disabled?'}</h2>
              <p>{disabledReason}</p>
            </div>
          </div>
        </FadeIn>
      </ReactModal>
    );
  }

  return {
    disabledReason,
    isDisabled,
    openWhyDisabledModal: handleOpenWhyDisabledModal,
    setOtherDisabledReasons: handleSetOtherDisabledReasonsCached,
    WhyDisabledModal: WhyDisabledModalCached,
  };
}
