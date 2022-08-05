import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useHistory} from 'react-router';
import {useSelector} from 'react-redux';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {CycleEllipsis} from '../../components/feedback';
import {FormFieldErrors} from '../../util/enums';
import {getValidationError, truncateEthAddress} from '../../util/helpers';
import {SnapshotMetadataType} from '../../components/proposals/types';
import {StoreState} from '../../store/types';
import {useSignAndSubmitProposal} from '../../components/proposals/hooks';
import {useWeb3Modal, useIsDefaultChain} from '../../components/web3/hooks';
import {Web3TxStatus} from '../../components/web3/types';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import PreviewInputMarkdown from '../../components/common/PreviewInputMarkdown';
import Wrap from '../../components/common/Wrap';

enum Fields {
  title = 'title',
  description = 'description',
}

type FormInputs = {
  title: string;
  description: string;
};

const getDelegatedAddressMessage = (a: string) =>
  `Your member address is delegated to ${truncateEthAddress(
    a,
    7
  )}. You must use that address.`;

export default function CreateGovernanceProposal() {
  /**
   * Selectors
   */

  const delegateAddress = useSelector(
    (s: StoreState) => s.connectedMember?.delegateKey
  );

  const isAddressDelegated = useSelector(
    (s: StoreState) => s.connectedMember?.isAddressDelegated
  );

  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Our hooks
   */

  const {connected, account} = useWeb3Modal();
  const {proposalSignAndSendStatus, signAndSendProposal} =
    useSignAndSubmitProposal<SnapshotType.proposal>();
  const {defaultChainError} = useIsDefaultChain();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const history = useHistory();

  /**
   * Variables
   */

  const {errors, getValues, register, trigger, watch} = form;
  const isConnected = connected && account;
  const isInProcess =
    proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
    proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone = proposalSignAndSendStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone;

  /**
   * Functions
   */

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return (
        <>
          <p style={{color:"#697FD4"}}>Connect your wallet to submit a governance proposal</p>
          </>
      )
      
    }

    // user is on wrong network
    if (defaultChainError) {
      return defaultChainError.message;
    }

    // user is not an active member
    if (!isActiveMember && !isAddressDelegated) {
      return 'Either you are not a member, or your membership is not active.';
    }

    // member has delegated to another address
    if (!isActiveMember && delegateAddress && isAddressDelegated) {
      return getDelegatedAddressMessage(delegateAddress);
    }
  }

  async function handleSubmit(values: FormInputs) {
    try {
      // Sign and submit proposal for Snapshot Hub
      const {uniqueId} = await signAndSendProposal({
        partialProposalData: {
          name: values.title,
          body: values.description,
          metadata: {
            type: SnapshotMetadataType.Governance,
          },
        },
        type: SnapshotType.proposal,
      });

      // Go to newly creatd governance proposal's page
      history.push(`/governance/${uniqueId}`);
    } catch (error) {
      const e = error as Error;

      setSubmitError(e);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    switch (proposalSignAndSendStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Awaiting your confirmation
            <CycleEllipsis intervalMs={500} />
          </>
        );
      case Web3TxStatus.PENDING:
        return (
          <>
            Submitting
            <CycleEllipsis intervalMs={500} />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return 'Done!';
      default:
        return '';
    }
  }

  /**
   * Render
   */

  // Render unauthorized message
  if (!isConnected || !isActiveMember || defaultChainError) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>{getUnauthorizedMessage()}</p>
        </div>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        {/* PROPOSAL TITLE */}
        <div className="form__input-row">
          <label className="form__input-row-label" htmlFor={Fields.title}>
            Title
          </label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby={`error-${Fields.title}`}
              aria-invalid={errors.title ? 'true' : 'false'}
              id={Fields.title}
              name={Fields.title}
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.title, errors)}
              id={`error-${Fields.title}`}
            />
          </div>
        </div>

        {/* PROPOSAL DESCRIPTION */}
        <div className="form__textarea-row">
          <label className="form__input-row-label" htmlFor={Fields.description}>
            Description
          </label>
          <div className="form__input-row-fieldwrap">
            <textarea
              aria-describedby={`error-${Fields.description}`}
              aria-invalid={errors.description ? 'true' : 'false'}
              id={Fields.description}
              name={Fields.description}
              placeholder="Say something about your governance proposal..."
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.description, errors)}
              id={`error-${Fields.description}`}
            />

            <PreviewInputMarkdown value={watch(Fields.description)} />
          </div>
        </div>

        {/* SUBMIT */}
        <button
          aria-label={isInProcess ? 'Submitting your proposal...' : ''}
          className="button"
          disabled={isInProcessOrDone}
          onClick={async () => {
            if (isInProcessOrDone) return;

            if (!(await trigger())) {
              return;
            }

            handleSubmit(getValues());
          }}
          type="submit">
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
        </button>

        {/* SUBMIT STATUS */}
        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {renderSubmitStatus()}
          </div>
        )}

        {/* SUBMIT ERROR */}
        {submitError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while submitting the proposal."
              error={submitError}
            />
          </div>
        )}
      </form>
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Governance Proposal</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            <p>
              As a member, you can make proposals related to the governance of
            CineCapsule. Describe the proposal in full so that others can make an
              informed decision. Include links to any additional supporting
              materials in the description to better explain your proposal.
            </p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
