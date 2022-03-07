import {AbiItem} from 'web3-utils/types';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {useState} from 'react';

import {AdaptersOrExtensions} from './types';
import {BURN_ADDRESS} from '../../util/constants';
import {DaoAdapterConstants} from './enums';
import {FormFieldErrors} from '../../util/enums';
import {getValidationError} from '../../util/helpers';
import {ParamInputType, ParamType} from './hooks/useValidation';
import {StoreState} from '../../store/types';
import {useAdaptersOrExtensions, useValidation} from './hooks';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {Web3TxStatus} from '../web3/types';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import InputError from '../common/InputError';
import Loader from '../feedback/Loader';

type ConfigurationFormProps = {
  abiConfigurationInputs: Record<string, any> | undefined;
  abiMethodName: string;
  adapterOrExtension: Pick<AdaptersOrExtensions, any> | undefined;
  closeHandler?: () => void;
};

type RemoveExtensionArgument = [
  //`extensionId`
  string
];

type RemoveAdapterArguments = [
  // `adapterId`
  string,
  // set to `BURN_ADDRESS` zero address
  string,
  // acl set to `0` - no access/permissions
  number,
  // keys
  [],
  // values
  []
];

export default function ConfigurationForm({
  abiConfigurationInputs,
  abiMethodName,
  adapterOrExtension,
  closeHandler,
}: ConfigurationFormProps) {
  /**
   * Selectors
   */
  const {DaoRegistryContract} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * State
   */
  const [submitError, setSubmitError] = useState<Error>();
  const [configureAdapterStatus, setConfigureAdapterStatus] =
    useState<Web3TxStatus>(Web3TxStatus.STANDBY);
  const [removeStatus, setRemoveStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {
    txError,
    // txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();

  const {isParamInputValid, getFormFieldError, formatInputByType} =
    useValidation();

  const {connected, account} = useWeb3Modal();
  const {getAdapterOrExtensionFromRedux} = useAdaptersOrExtensions();
  const {average: gasPrice} = useETHGasPrice();

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
  const {errors, formState, getValues, setValue, register, trigger} = form;
  const configureAdapterError = submitError || txError;
  const isConnected = connected && account;
  const adapterOrExtensionText = adapterOrExtension?.isExtension
    ? 'extension'
    : 'adapter';

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
    (removeStatus === Web3TxStatus.AWAITING_CONFIRM ||
      removeStatus === Web3TxStatus.PENDING);

  const isConfigureDone =
    txStatus === Web3TxStatus.FULFILLED &&
    configureAdapterStatus === Web3TxStatus.FULFILLED;

  const isRemoveDone =
    txStatus === Web3TxStatus.FULFILLED &&
    removeStatus === Web3TxStatus.FULFILLED;

  const isConfigureInProcessOrDone =
    (isConfigureInProcess || isConfigureDone) && txIsPromptOpen;

  const isRemoveInProcessOrDone =
    (isRemoveInProcess || isRemoveDone) && txIsPromptOpen;

  /**
   * handleRemove()
   */
  async function handleRemove(): Promise<void> {
    if (!DaoRegistryContract) return;

    try {
      setRemoveStatus(Web3TxStatus.AWAITING_CONFIRM);

      const removeExtensionArgument: RemoveExtensionArgument = [
        adapterOrExtension?.extensionId,
      ];

      const removeAdapterArguments: RemoveAdapterArguments = [
        adapterOrExtension?.adapterId,
        BURN_ADDRESS,
        0,
        [],
        [],
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call to `removeExtension` or `replaceAdapter`
      await txSend(
        adapterOrExtension?.isExtension ? 'removeExtension' : 'replaceAdapter',
        DaoRegistryContract.instance.methods,
        adapterOrExtension?.isExtension
          ? removeExtensionArgument
          : removeAdapterArguments,
        txArguments
      );

      setRemoveStatus(Web3TxStatus.FULFILLED);

      // Close modal
      closeHandler &&
        setTimeout(() => {
          closeHandler();
          // @todo Display closing modal message
        }, 3000);
    } catch (error) {
      const e = error as Error;

      setSubmitError(e);
      setRemoveStatus(Web3TxStatus.REJECTED);
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
      } = getAdapterOrExtensionFromRedux(
        adapterOrExtension?.name as DaoAdapterConstants
      );

      if (!isConnected) {
        throw new Error(
          'No user account was found. Please make sure your wallet is connected.'
        );
      }

      if (!contractAddress) {
        throw new Error(`No ${adapterOrExtension?.name} contract found.`);
      }

      if (!account) {
        throw new Error('No account found.');
      }

      let adapterConfigArguments: Array<ParamInputType> = [];
      // construct method arguments
      abiConfigurationInputs?.forEach((abiInput: AbiItem) => {
        const inputValue = Object.entries(values).find(
          (v: any) => v[0] === abiInput.name
        );

        if (inputValue) {
          const formattedValue: ParamInputType = formatInputByType(
            inputValue[1] as ParamInputType,
            abiInput.type as ParamType
          );

          adapterConfigArguments.push(formattedValue);
        }
      });

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      setConfigureAdapterStatus(Web3TxStatus.AWAITING_CONFIRM);

      // Execute contract call
      await txSend(abiMethodName, methods, adapterConfigArguments, txArguments);

      setConfigureAdapterStatus(Web3TxStatus.FULFILLED);
    } catch (error) {
      const e = error as Error;

      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(e);
      setConfigureAdapterStatus(Web3TxStatus.REJECTED);
    }
  }

  return (
    <form className="form" onSubmit={(e) => e.preventDefault()}>
      {/* INPUT PARAMETERS */}
      {abiConfigurationInputs &&
        abiConfigurationInputs.map((input: Record<string, any>) => (
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
                  setValue(input.name[0], getValues()[input.name])
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
            trigger();
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

      {/* SUBMIT ERROR */}
      {configureAdapterError && (
        <div className="form__submit-error-container">
          <ErrorMessageWithDetails
            renderText="Something went wrong while submitting the adapter configuration."
            error={configureAdapterError}
          />
        </div>
      )}

      {/** REMOVE EXTENSION BUTTON - @todo only show if DAO isn't finalized */}
      <div className="adapter-extension__remove">
        <p>
          Delete this {adapterOrExtensionText}. Once you delete this{' '}
          {adapterOrExtensionText}, it can be re-added if the DAO isn't
          finalized.
        </p>
        <button
          className="button--secondary"
          disabled={isRemoveInProcessOrDone || isConfigureInProcessOrDone}
          onClick={() => (isRemoveDone ? {} : handleRemove())}>
          {isRemoveInProcess ? <Loader /> : isRemoveDone ? 'Done' : 'Remove'}
        </button>
      </div>
    </form>
  );
}
