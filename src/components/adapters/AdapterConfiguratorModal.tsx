import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';

import {DaoConstants} from './config';
import {StoreState} from '../../store/types';
import {AsyncStatus, MetaMaskRPCError} from '../../util/types';
import {getValidationError} from '../../util/helpers';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';

import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Modal from '../common/Modal';

import TimesSVG from '../../assets/svg/TimesSVG';

type AdapterConfiguratorModalProps = {
  abiMethodName: string;
  adapterId: string;
  adapterName: string;
  configurationInputs: Record<string, any> | undefined;
  isOpen: boolean;
  closeHandler: () => void;
};

type RemoveAdapterArguments = [
  string // `adapterId`
];

export default function AdapterConfiguratorModal({
  abiMethodName,
  adapterId,
  adapterName,
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

  /**
   * Hooks
   */
  const {
    txError,
    // txEtherscanURL,
    txIsPromptOpen,
    txSend,
    // txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();
  const {connected, account} = useWeb3Modal();

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

  const isInProcess = false; // temp
  // txStatus === Web3TxStatus.AWAITING_CONFIRM ||
  // txStatus === Web3TxStatus.PENDING ||
  // proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
  // proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone = false; // temp
  // txStatus === Web3TxStatus.FULFILLED &&
  // proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  function getAdapter(adapterName: DaoConstants): Record<string, any> {
    return Object.keys(adapterContracts)
      .map((a) => adapterContracts[a])
      .filter((a) => a.adapterName === adapterName)[0];
  }

  /**
   * removeAdapter()
   * @param adapter
   */
  async function removeAdapter() {
    console.log('remove: adapterId', adapterId);
    if (!DaoRegistryContract) return;

    try {
      const removeAdapterArguments: RemoveAdapterArguments = [
        adapterId, // [0]bytes32 adapterId
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
    } catch (error) {
      setSubmitError(error);
    }
  }

  async function handleSubmit(values: Record<string, any>) {
    try {
      console.log('values', values);

      const {
        contractAddress,
        instance: {methods},
      } = getAdapter(adapterName as DaoConstants);
      console.log('adapterContract: contractAddress', contractAddress, methods);

      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!contractAddress) {
        throw new Error(`No ${adapterName} contract found.`);
      }

      if (!account) {
        throw new Error('No account found.');
      }

      console.log('array values', Object.values(values));

      const adapterConfigArguments: string | number[] = Object.values(values);
      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call
      await txSend(abiMethodName, methods, adapterConfigArguments, txArguments);

      // close modal
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
      console.log('error', error);
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

        <h1>{adapterName.toUpperCase()}</h1>
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
                        [input.name],
                        getValues()[input.name]
                        // @todo  validate input
                      )
                    }
                    ref={register}
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
            <button className="button--secondary" onClick={removeAdapter}>
              Remove
            </button>
            {/** @todo maybe modal popup to configure and remove */}
          </div>
        </form>
      </>
    </Modal>
  );
}
