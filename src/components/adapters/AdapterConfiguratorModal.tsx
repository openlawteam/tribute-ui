import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';

import {Adapters, DaoConstants} from './config';
import {StoreState} from '../../store/types';
import {MetaMaskRPCError} from '../../util/types';
import {Web3TxStatus} from '../web3/types';
import {FormFieldErrors} from '../../util/enums';
import {getValidationError} from '../../util/helpers';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useValidation} from './hooks/useValidation';

import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import EtherscanURL from '../../components/web3/EtherscanURL';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Modal from '../common/Modal';

import TimesSVG from '../../assets/svg/TimesSVG';

type AdapterConfiguratorModalProps = {
  abiMethodName: string;
  adapter: Adapters | undefined;
  configurationInputs: Record<string, any> | undefined;
  isOpen: boolean;
  closeHandler: () => void;
};

type RemoveAdapterArguments = [
  string // `adapterId`
];

export default function AdapterConfiguratorModal({
  abiMethodName,
  adapter,
  configurationInputs,
  isOpen,
  closeHandler,
}: AdapterConfiguratorModalProps) {
  /**
   * Selectors
   */
  const {DaoRegistryContract, ...adapterContracts} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * State
   */
  const [submitError, setSubmitError] = useState<Error>();
  const [
    configureAdapterStatus,
    setConfigureAdapterStatus,
  ] = useState<Web3TxStatus>(Web3TxStatus.STANDBY);
  const [removeAdapterStatus, setRemoveAdapterStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Hooks
   */
  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();
  const {connected, account} = useWeb3Modal();
  const {isParamInputValid, getFormFieldError} = useValidation();

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
  const configureAdapterError = submitError || txError;
  const isConnected = connected && account;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isConfigureInProcess =
    (txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      txStatus === Web3TxStatus.PENDING) &&
    (configureAdapterStatus === Web3TxStatus.AWAITING_CONFIRM ||
      configureAdapterStatus === Web3TxStatus.PENDING);
  const isRemoveInProcess =
    (txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      txStatus === Web3TxStatus.PENDING) &&
    (removeAdapterStatus === Web3TxStatus.AWAITING_CONFIRM ||
      removeAdapterStatus === Web3TxStatus.PENDING);

  const isConfigureDone =
    txStatus === Web3TxStatus.FULFILLED &&
    configureAdapterStatus === Web3TxStatus.FULFILLED;
  const isRemoveDone =
    txStatus === Web3TxStatus.FULFILLED &&
    removeAdapterStatus === Web3TxStatus.FULFILLED;

  const isConfigureInProcessOrDone =
    (isConfigureInProcess || isConfigureDone) && txIsPromptOpen;
  const isRemoveInProcessOrDone =
    (isRemoveInProcess || isRemoveDone) && txIsPromptOpen;

  function getAdapter(adapterName: DaoConstants): Record<string, any> {
    return Object.keys(adapterContracts)
      .map((a) => adapterContracts[a])
      .filter((a) => a.adapterName === adapterName)[0];
  }

  /**
   * handleRemoveAdapter()
   */
  async function handleRemoveAdapter(): Promise<void> {
    if (!DaoRegistryContract) return;

    try {
      setRemoveAdapterStatus(Web3TxStatus.AWAITING_CONFIRM);

      const removeAdapterArguments: RemoveAdapterArguments = [
        adapter?.adapterId || '', // [0]bytes32 adapterId
      ];
      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `removeAdapter`
      await txSend(
        'removeAdapter',
        DaoRegistryContract.instance.methods,
        removeAdapterArguments,
        txArguments
      );

      setRemoveAdapterStatus(Web3TxStatus.FULFILLED);

      // Close modal
      setTimeout(() => {
        closeHandler();
        // @todo Display closing modal message
      }, 3000);
    } catch (error) {
      setSubmitError(error);
      setRemoveAdapterStatus(Web3TxStatus.REJECTED);
    }
  }

  /**
   * handleSubmit()
   * @param values
   */
  async function handleSubmit(values: Record<string, any>) {
    try {
      setConfigureAdapterStatus(Web3TxStatus.PENDING);

      const {
        contractAddress,
        instance: {methods},
      } = getAdapter(adapter?.adapterName as DaoConstants);

      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!contractAddress) {
        throw new Error(`No ${adapter?.adapterName} contract found.`);
      }

      if (!account) {
        throw new Error('No account found.');
      }

      const adapterConfigArguments: string | number[] = Object.values(values);

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      setConfigureAdapterStatus(Web3TxStatus.AWAITING_CONFIRM);

      // Execute contract call
      await txSend(abiMethodName, methods, adapterConfigArguments, txArguments);

      setConfigureAdapterStatus(Web3TxStatus.FULFILLED);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
      setConfigureAdapterStatus(Web3TxStatus.REJECTED);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // Chain tx
    if (txStatus === Web3TxStatus.AWAITING_CONFIRM) {
      return 'Awaiting your confirmation\u2026';
    }

    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={TX_CYCLE_MESSAGES}
              useFirstItemStart
              render={(message) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>Change submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <Modal
      keyProp="adapter-configurator"
      modalClassNames="adapter-configurator-modal"
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

        <h1>{adapter?.adapterName.toUpperCase()}</h1>
        <p>{adapter?.adapterDescription}</p>

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
                      setValue([input.name], getValues()[input.name])
                    }
                    ref={register({
                      validate: (value: string): string | boolean => {
                        return value === ''
                          ? FormFieldErrors.REQUIRED
                          : isParamInputValid(value, input.type)
                          ? true
                          : getFormFieldError(input.type);
                      },
                    })}
                    disabled={isConfigureInProcessOrDone}
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
            disabled={isConfigureInProcessOrDone || isRemoveInProcessOrDone}
            onClick={() => {
              if (isConfigureInProcessOrDone) return;

              if (!isValid) {
                triggerValidation();
                return;
              }

              handleSubmit(getValues());
            }}
            type="submit">
            {isConfigureInProcess ? (
              <Loader />
            ) : isConfigureDone ? (
              'Done'
            ) : (
              'Submit'
            )}
          </button>

          {/* SUBMIT CONFIGURE STATUS */}
          <div className="form__submit-status-container">
            {isConfigureInProcessOrDone && renderSubmitStatus()}
          </div>

          {/* SUBMIT ERROR */}
          {configureAdapterError &&
            (configureAdapterError as MetaMaskRPCError).code !== 4001 && (
              <div className="form__submit-error-container">
                <ErrorMessageWithDetails
                  renderText="Something went wrong while submitting the adapter configuration."
                  error={configureAdapterError}
                />
              </div>
            )}

          {/** REMOVE ADAPTER BUTTON */}
          <div className="adaptermanager__remove">
            <p>
              Delete this adapter. Once you delete this adapter, it can be
              re-added if the DAO isn't finalized.
            </p>
            <button
              className="button--secondary"
              disabled={isRemoveInProcessOrDone || isConfigureInProcessOrDone}
              onClick={handleRemoveAdapter}>
              {isRemoveInProcess ? (
                <Loader />
              ) : isRemoveDone ? (
                'Done'
              ) : (
                'Remove'
              )}
            </button>

            {/* SUBMIT REMOVE STATUS */}
            <div className="form__submit-status-container">
              {isRemoveInProcessOrDone && renderSubmitStatus()}
            </div>
          </div>
        </form>
      </>
    </Modal>
  );
}
