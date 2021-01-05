import React, {useState} from 'react';
import {useForm} from 'react-hook-form';

import {FormFieldErrors, Web3TxStatus} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {getValidationError} from '../../util/helpers';
import {useETHGasPrice, useIsDefaultChain} from '../../hooks';
import {useWeb3Modal} from '../../components/web3/Web3ModalManager';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';

enum Fields {
  ethAddress = 'ethAddress',
}

type FormInputs = {
  ethAddress: string;
};

// validation configuration for react-hook-form
const ruleRequired = {
  required: FormFieldErrors.REQUIRED,
};

const validateEthAddress = {
  validate: (ethAddress: string): string | boolean => {
    return !ethAddress
      ? FormFieldErrors.REQUIRED
      : !isEthAddressValid(ethAddress)
      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
      : true;
  },
};

const validateConfig: Partial<Record<Fields, Record<string, any>>> = {
  ethAddress: validateEthAddress,
};

export default function CreateMemberProposal() {
  /**
   * Hooks
   */

  const {isDefaultChain, defaultChainError} = useIsDefaultChain();
  const {connected, account} = useWeb3Modal();
  const gasPrices = useETHGasPrice();

  /**
   * External hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * State
   */

  const [submitStatus, setSubmitStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );
  const [handleSubmitError, setHandleSubmitError] = useState<Error>();
  const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);

  /**
   * Variables
   */

  const {
    control,
    errors,
    formState,
    getValues,
    register,
    triggerValidation,
  } = form;

  const isConnected = connected && account;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isInProcessOrDone =
    submitStatus === Web3TxStatus.AWAITING_CONFIRM ||
    submitStatus === Web3TxStatus.PENDING ||
    submitStatus === Web3TxStatus.FULFILLED ||
    isPromptOpen;

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        {/* ETH ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label">ETH address</label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby="error-ethAddress"
              aria-invalid={errors.ethAddress ? 'true' : 'false'}
              name={Fields.ethAddress}
              ref={
                validateConfig.ethAddress && register(validateConfig.ethAddress)
              }
              type="text"
              disabled={isInProcessOrDone}
            />
            <InputError
              error={getValidationError(Fields.ethAddress, errors)}
              id="error-ethAddress"
            />
          </div>
        </div>
      </form>
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
          <h2 className="titlebar__title">Join</h2>
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
