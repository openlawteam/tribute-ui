import React from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {useWeb3Modal} from '../../components/web3/hooks';
import FadeIn from '../../components/common/FadeIn';
import Wrap from '../../components/common/Wrap';
import {useForm} from 'react-hook-form';
import {FormFieldErrors} from '../../util/enums';
import {getValidationError} from '../../util/helpers';
import InputError from '../../components/common/InputError';

enum Fields {
  title = 'title',
  description = 'description',
}

type FormInputs = {
  title: string;
  description: string;
};

export default function CreateGovernanceProposal() {
  /**
   * Selectors
   */

  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  /**
   * Our hooks
   */

  const {connected, account} = useWeb3Modal();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * Variables
   */

  const {errors, getValues, setValue, register, trigger, watch} = form;
  const isConnected = connected && account;

  /**
   * Functions
   */

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to submit a governance proposal.';
    }

    // user is not an active member
    if (!isActiveMember) {
      return 'Either you are not a member, or your membership is not active.';
    }
  }

  /**
   * Render
   */

  // Render unauthorized message
  if (!isConnected || !isActiveMember) {
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
            {/* @note We don't need the default value as it's handled in the useEffect above. */}
            <input
              aria-describedby={`error-${Fields.title}`}
              aria-invalid={errors.title ? 'true' : 'false'}
              id={Fields.title}
              name={Fields.title}
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              type="text"
              // disabled={isInProcessOrDone}
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
              id={Fields.description}
              name={Fields.description}
              placeholder="Say something about your governance proposal..."
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              // disabled={isInProcessOrDone}
            />
          </div>
        </div>
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
              Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla
              consectetur id nec massa. Aliquam erat volutpat. Sed ut dui ut
              lacus dictum fermentum vel tincidunt neque. Sed sed lacinia...
            </p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
