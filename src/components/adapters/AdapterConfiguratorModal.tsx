import React, {useState} from 'react';
import {useForm} from 'react-hook-form';

import {getValidationError} from '../../util/helpers';

import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Modal from '../common/Modal';

import TimesSVG from '../../assets/svg/TimesSVG';

type AdapterConfiguratorModalProps = {
  configurationInputs: Record<string, any> | undefined;
  isOpen: boolean;
  closeHandler: () => void;
};

export default function AdapterConfiguratorModal({
  configurationInputs,
  isOpen,
  closeHandler,
}: AdapterConfiguratorModalProps) {
  /**
   * State
   */

  /**
   * Their hooks
   */
  const form = useForm<Record<string, any>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * Variables
   */

  const {
    errors,
    formState,
    getValues,
    setValue,
    register,
    triggerValidation,
  } = form;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isInProcess = false; // temp
  // txStatus === Web3TxStatus.AWAITING_CONFIRM ||
  // txStatus === Web3TxStatus.PENDING ||
  // proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
  // proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone = false; // temp
  // txStatus === Web3TxStatus.FULFILLED &&
  // proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone; //|| txIsPromptOpen;

  console.log('configurationInputs', configurationInputs);

  async function handleSubmit(values: Record<string, any>) {
    try {
      console.log('values', values);
      // if (!isConnected) {
      //   throw new Error(
      //     'No user account was found. Please makes sure your wallet is connected.'
      //   );
      // }

      // if (!OnboardingContract) {
      //   throw new Error('No OnboardingContract found.');
      // }

      // if (!DaoRegistryContract) {
      //   throw new Error('No DaoRegistryContract found.');
      // }

      // if (!account) {
      //   throw new Error('No account found.');
      // }

      // close modal
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      // setSubmitError(error);
    }
  }

  return (
    <Modal
      keyProp="adapter-configurator"
      isOpen={isOpen}
      isOpenHandler={() => {
        closeHandler();
      }}>
      {/* MODEL CLOSE BUTTON */}
      <>
        <span
          className="modal__close-button"
          onClick={() => {
            closeHandler();
          }}>
          <TimesSVG />
        </span>

        <h1>[adapter name]</h1>
        <p>supplementary text...</p>

        <form className="form" onSubmit={(e) => e.preventDefault()}>
          {/* INPUT PARAMETERS */}
          {configurationInputs &&
            configurationInputs.map((input: Record<string, any>) => (
              <div className="form__input-row" key={input.name}>
                <label className="form__input-row-label">{input.name}</label>
                <div className="form__input-row-fieldwrap">
                  <input
                    aria-describedby={`error-${input.name}`}
                    aria-invalid={errors[input.name] ? 'true' : 'false'}
                    name={input.name}
                    placeholder={input.type}
                    type="text"
                    onChange={() =>
                      setValue(
                        [input.name]
                        // @todo  validate input formatNumber(getValues().ethAmount)
                      )
                    }
                    disabled={isInProcessOrDone}
                  />

                  <InputError
                    error={getValidationError(input.name, errors)}
                    id={`error-${input.name}`}
                  />
                </div>
              </div>
            ))}

          {/* SUBMIT */}
          <button
            className="button"
            disabled={isInProcessOrDone}
            onClick={() => {
              if (isInProcessOrDone) return;
              if (!isValid) {
                triggerValidation();
                return;
              }
              handleSubmit(getValues());
            }}
            type="submit">
            {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
          </button>

          {/* SUBMIT STATUS */}
          {/* <div className="form__submit-status-container">
          {isInProcessOrDone && renderSubmitStatus()}
        </div> */}

          {/* SUBMIT ERROR */}
          {/* {createMemberError &&
          (createMemberError as MetaMaskRPCError).code !== 4001 && (
            <div className="form__submit-error-container">
              <ErrorMessageWithDetails
                renderText="Something went wrong while submitting the proposal."
                error={createMemberError}
              />
            </div>
          )} */}
        </form>
      </>
    </Modal>
  );
}
