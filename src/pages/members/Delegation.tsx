import {useState, useEffect, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useForm} from 'react-hook-form';
import {toChecksumAddress} from 'web3-utils';

import {BURN_ADDRESS} from '../../util/constants';
import {CheckboxSize} from '../../components/common/Checkbox';
import {FormFieldErrors} from '../../util/enums';
import {getConnectedMember} from '../../store/actions';
import {
  getValidationError,
  normalizeString,
  truncateEthAddress,
} from '../../util/helpers';
import {isEthAddressValid} from '../../util/validation';
import {ReduxDispatch, StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {
  useWeb3Modal,
  useContractSend,
  useETHGasPrice,
} from '../../components/web3/hooks';
import {Web3TxStatus} from '../../components/web3/types';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import EtherscanURL from '../../components/web3/EtherscanURL';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Modal from '../../components/common/Modal';
import TimesSVG from '../../assets/svg/TimesSVG';
import UserSVG from '../../assets/svg/UserSVG';

enum DelegationStatus {
  DELEGATE = 'Delegate',
  REVOKE_DELEGATION = 'Revoke Delegation',
  UPDATE_DELEGATE = 'Update Delegate',
}

enum DelegationStep {
  SET_DELEGATION = 'setDelegation',
  REVOKE_DELEGATION = 'revokeDelegation',
  UPDATE_DELEGATION = 'updateDelegation',
}

enum Fields {
  delegateAddress = 'delegateAddress',
  confirmDelegation = 'confirmDelegation',
}

type Steps = 'setDelegation' | 'revokeDelegation' | 'updateDelegation';

type StepsType = {[S in Steps]: () => JSX.Element};

type FormInputs = {
  delegateAddress: string;
  confirmDelegation: boolean;
};

type UpdateDelegateKeyArguments = [
  dao: string, // `dao`
  delegateKey: string // `delegateKey`
];

type DelegationModalProps = {
  isOpen: boolean;
  closeHandler: () => void;
  currentStep: string;
};

function DelegationModal({
  isOpen,
  closeHandler,
  currentStep,
}: DelegationModalProps): JSX.Element {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );
  const daoRegistryAdapterContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryAdapterContract
  );
  const connectedMember = useSelector((s: StoreState) => s.connectedMember);

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();
  const {average: gasPrice} = useETHGasPrice();

  const {txError, txEtherscanURL, txIsPromptOpen, txSend, txStatus} =
    useContractSend();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Variables
   */

  const {errors, getValues, register, trigger, watch} = form;
  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;
  const isDone = txStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;
  const delegateError = submitError || txError;

  const delegateAddressValue = watch(Fields.delegateAddress);
  const confirmDelegationValue = watch(Fields.confirmDelegation);
  const isFormFieldEmpty = !delegateAddressValue || !confirmDelegationValue;
  const steps: StepsType = {
    setDelegation: renderSetDelegation,
    revokeDelegation: renderRevokeDelegation,
    updateDelegation: renderUpdateDelegation,
  };

  /**
   * Functions
   */

  function renderCurrentStep() {
    return steps[currentStep]();
  }

  function renderSetDelegation() {
    return (
      <>
        {/* TITLE */}
        <div className="modal__title">Delegate</div>

        <p>Transfer your member rights</p>
        <div className="delegation-modal__arrow-down">&darr;</div>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          {/* DELEGATE ADDRESS */}
          <div className="form__input-row">
            <div className="form__input-row-fieldwrap">
              <input
                aria-describedby={`error-${Fields.delegateAddress}`}
                aria-invalid={errors.delegateAddress ? 'true' : 'false'}
                name={Fields.delegateAddress}
                ref={register({
                  validate: (delegateAddress: string): string | boolean => {
                    return !delegateAddress
                      ? FormFieldErrors.REQUIRED
                      : !isEthAddressValid(delegateAddress) ||
                        delegateAddress === BURN_ADDRESS
                      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
                placeholder="Enter delegate address"
              />

              {getValidationError(Fields.delegateAddress, errors).includes(
                'invalid'
              ) && (
                <InputError
                  error={getValidationError(Fields.delegateAddress, errors)}
                  id={`error-${Fields.delegateAddress}`}
                />
              )}
            </div>
          </div>

          {/* CONFIRM DELEGATION */}
          <div className="form__input-row" style={{marginTop: 0}}>
            <div className="form__input-row-fieldwrap">
              <input
                className="checkbox-input"
                aria-describedby={`error-${Fields.confirmDelegation}`}
                aria-invalid={errors.confirmDelegation ? 'true' : 'false'}
                id={Fields.confirmDelegation}
                name={Fields.confirmDelegation}
                ref={register({
                  required: FormFieldErrors.REQUIRED,
                })}
                type="checkbox"
                disabled={isInProcessOrDone}
              />

              <label
                className="checkbox-label"
                htmlFor={Fields.confirmDelegation}>
                <span className={`checkbox-box ${CheckboxSize.SMALL}`}></span>
                <span className="checkbox-text">
                  Confirm delegation to the above address. You can revoke this
                  at any time from your profile.
                </span>
              </label>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            aria-label={isInProcess ? 'Updating your delegate key...' : ''}
            className="button"
            disabled={isInProcessOrDone || isFormFieldEmpty}
            onClick={async () => {
              if (isInProcessOrDone) return;

              if (!(await trigger())) {
                return;
              }

              handleConfirmDelegation(getValues());
            }}
            type="submit">
            {isInProcess ? <Loader /> : isDone ? 'Done' : 'Confirm'}
          </button>

          {/* SUBMIT STATUS */}
          {isInProcessOrDone && (
            <div className="form__submit-status-container">
              {renderSubmitStatus()}
            </div>
          )}

          {/* SUBMIT ERROR */}
          {delegateError && (
            <div className="form__submit-error-container">
              <ErrorMessageWithDetails
                renderText="Something went wrong with your delegation."
                error={delegateError}
              />
            </div>
          )}
        </form>
      </>
    );
  }

  function renderRevokeDelegation() {
    if (connectedMember) {
      return (
        <>
          {/* TITLE */}
          <div className="modal__title">Revoke Delegation</div>

          <p>{truncateEthAddress(connectedMember.delegateKey, 7)}</p>
          <div className="delegation-modal__arrow-down">&darr;</div>
          <p>
            <UserSVG />
            Back to you
          </p>
          <div className="delegation-modal__text">
            You&apos;ll be able to resume member actions from your account. You
            can delegate again at any time from your profile.
          </div>

          {/* SUBMIT */}
          <button
            aria-label={isInProcess ? 'Updating your delegate key...' : ''}
            className="button"
            disabled={isInProcessOrDone}
            onClick={handleRevokeDelegation}>
            {isInProcess ? <Loader /> : isDone ? 'Done' : 'Confirm'}
          </button>

          {/* SUBMIT STATUS */}
          {isInProcessOrDone && (
            <div className="form__submit-status-container">
              {renderSubmitStatus()}
            </div>
          )}

          {/* SUBMIT ERROR */}
          {delegateError && (
            <div className="form__submit-error-container">
              <ErrorMessageWithDetails
                renderText="Something went wrong with your revocation."
                error={delegateError}
              />
            </div>
          )}
        </>
      );
    }

    return <></>;
  }

  function renderUpdateDelegation() {
    return (
      <>
        {/* TITLE */}
        <div className="modal__title">Update Delegate</div>

        <p>Transfer your member rights</p>
        <div className="delegation-modal__arrow-down">&darr;</div>
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          {/* DELEGATE ADDRESS */}
          <div className="form__input-row">
            <div className="form__input-row-fieldwrap">
              <input
                aria-describedby={`error-${Fields.delegateAddress}`}
                aria-invalid={errors.delegateAddress ? 'true' : 'false'}
                name={Fields.delegateAddress}
                ref={register({
                  validate: (delegateAddress: string): string | boolean => {
                    return !delegateAddress
                      ? FormFieldErrors.REQUIRED
                      : !isEthAddressValid(delegateAddress) ||
                        delegateAddress === BURN_ADDRESS
                      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
                placeholder="Enter delegate address"
              />

              {getValidationError(Fields.delegateAddress, errors).includes(
                'invalid'
              ) && (
                <InputError
                  error={getValidationError(Fields.delegateAddress, errors)}
                  id={`error-${Fields.delegateAddress}`}
                />
              )}
            </div>
          </div>

          {/* CONFIRM DELEGATION */}
          <div className="form__input-row" style={{marginTop: 0}}>
            <div className="form__input-row-fieldwrap">
              <input
                className="checkbox-input"
                aria-describedby={`error-${Fields.confirmDelegation}`}
                aria-invalid={errors.confirmDelegation ? 'true' : 'false'}
                id={Fields.confirmDelegation}
                name={Fields.confirmDelegation}
                ref={register({
                  required: FormFieldErrors.REQUIRED,
                })}
                type="checkbox"
                disabled={isInProcessOrDone}
              />

              <label
                className="checkbox-label"
                htmlFor={Fields.confirmDelegation}>
                <span className={`checkbox-box ${CheckboxSize.SMALL}`}></span>
                <span className="checkbox-text">
                  Confirm delegation to the above address. You will no longer be
                  a delegate with member rights.
                </span>
              </label>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            aria-label={isInProcess ? 'Updating the delegate key...' : ''}
            className="button"
            disabled={isInProcessOrDone || isFormFieldEmpty}
            onClick={async () => {
              if (isInProcessOrDone) return;

              if (!(await trigger())) {
                return;
              }

              handleConfirmDelegation(getValues());
            }}
            type="submit">
            {isInProcess ? <Loader /> : isDone ? 'Done' : 'Confirm'}
          </button>

          {/* SUBMIT STATUS */}
          {isInProcessOrDone && (
            <div className="form__submit-status-container">
              {renderSubmitStatus()}
            </div>
          )}

          {/* SUBMIT ERROR */}
          {delegateError && (
            <div className="form__submit-error-container">
              <ErrorMessageWithDetails
                renderText="Something went wrong with updating the delegate."
                error={delegateError}
              />
            </div>
          )}
        </form>
      </>
    );
  }

  async function handleConfirmDelegation(values: FormInputs) {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!daoRegistryAdapterContract) {
        throw new Error('No DAO Registry Adapter contract was found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const {delegateAddress} = values;

      const updateDelegateKeyArguments: UpdateDelegateKeyArguments = [
        daoRegistryContract.contractAddress,
        toChecksumAddress(delegateAddress),
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call for `updateDelegateKey`
      const tx = await txSend(
        'updateDelegateKey',
        daoRegistryAdapterContract.instance.methods,
        updateDelegateKeyArguments,
        txArguments
      );

      if (tx) {
        setTimeout(async () => {
          // re-fetch member
          await dispatch(
            getConnectedMember({
              account,
              daoRegistryContract,
              web3Instance,
            })
          );

          closeHandler();
        }, 2000);
      }
    } catch (error) {
      const e = error as Error;

      console.log(e);
      let parsedError = e;

      if (
        e.message.includes('cannot overwrite existing delegated keys') ||
        e.message.includes('address already taken as delegated key')
      ) {
        parsedError = new Error(
          'The provided address cannot be another member or already in use as a delegate.'
        );
      }

      setSubmitError(parsedError);
    }
  }

  async function handleRevokeDelegation() {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!daoRegistryAdapterContract) {
        throw new Error('No DAO Registry Adapter contract was found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const updateDelegateKeyArguments: UpdateDelegateKeyArguments = [
        daoRegistryContract.contractAddress,
        toChecksumAddress(account),
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call for `updateDelegateKey`
      const tx = await txSend(
        'updateDelegateKey',
        daoRegistryAdapterContract.instance.methods,
        updateDelegateKeyArguments,
        txArguments
      );

      if (tx) {
        setTimeout(async () => {
          // re-fetch member
          await dispatch(
            getConnectedMember({
              account,
              daoRegistryContract,
              web3Instance,
            })
          );

          closeHandler();
        }, 2000);
      }
    } catch (error) {
      const e = error as Error;

      console.log(e);

      setSubmitError(e);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return 'Awaiting your confirmation\u2026';
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
            <div>Submitted!</div>

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
    <Modal
      keyProp="delegation"
      isOpen={isOpen}
      // Require user to click on close button to avoid accidental modal close
      // during transaction
      isOpenHandler={() => {}}
      modalClassNames="delegation-modal">
      {/* MODEL CLOSE BUTTON */}
      <span
        className="modal__close-button"
        onClick={() => {
          closeHandler();
        }}>
        <TimesSVG />
      </span>
      {renderCurrentStep()}
    </Modal>
  );
}

export default function Delegation() {
  /**
   * Selectors
   */

  const connectedMember = useSelector((s: StoreState) => s.connectedMember);

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();

  /**
   * State
   */

  const [currentStep, setCurrentStep] = useState<string>(
    DelegationStep.SET_DELEGATION
  );
  const [delegationStatus, setDelegationStatus] = useState<string>('');
  const [showDelegationModal, setShowDelegationModal] =
    useState<boolean>(false);

  /**
   * Cached callbacks
   */

  const fetchDelegationInfoCached = useCallback(fetchDelegationInfo, [
    account,
    connectedMember,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    fetchDelegationInfoCached();
  }, [fetchDelegationInfoCached]);

  /**
   * Functions
   */

  function fetchDelegationInfo() {
    if (!connectedMember || !account) return;

    const {delegateKey, isAddressDelegated, isActiveMember, memberAddress} =
      connectedMember;

    if (
      // NO CURRENT DELEGATION VIEWED BY MEMBER
      isActiveMember &&
      !isAddressDelegated &&
      normalizeString(account) === normalizeString(memberAddress)
    ) {
      setCurrentStep(DelegationStep.SET_DELEGATION);
      setDelegationStatus(DelegationStatus.DELEGATE);
    } else if (
      // CURRENT DELEGATION VIEWED BY MEMBER
      !isActiveMember &&
      isAddressDelegated &&
      normalizeString(account) === normalizeString(memberAddress)
    ) {
      setCurrentStep(DelegationStep.REVOKE_DELEGATION);
      setDelegationStatus(DelegationStatus.REVOKE_DELEGATION);
    } else if (
      // CURRENT DELEGATION VIEWED BY DELEGATE
      isActiveMember &&
      !isAddressDelegated &&
      normalizeString(account) === normalizeString(delegateKey)
    ) {
      setCurrentStep(DelegationStep.UPDATE_DELEGATION);
      setDelegationStatus(DelegationStatus.UPDATE_DELEGATE);
    }
  }

  function renderDelegationStatus(): JSX.Element {
    if (!connectedMember) return <></>;

    switch (delegationStatus) {
      case DelegationStatus.DELEGATE:
        // NO CURRENT DELEGATION VIEWED BY MEMBER
        return (
          <>
            You can delegate your member rights to a different ETH address. The
            address cannot be another member or already in use as a delegate.
          </>
        );
      case DelegationStatus.REVOKE_DELEGATION:
        // CURRENT DELEGATION VIEWED BY MEMBER
        return (
          <>
            Your member rights have been delegated to{' '}
            <span className="delegation__delegate-address-text">
              {truncateEthAddress(connectedMember.delegateKey, 7)}
            </span>
            . You can revoke this at any time.
          </>
        );
      case DelegationStatus.UPDATE_DELEGATE:
        // CURRENT DELEGATION VIEWED BY DELEGATE
        return (
          <>
            The member rights have been delegated to you{' '}
            <span className="delegation__delegate-address-text">
              {truncateEthAddress(connectedMember.delegateKey, 7)}
            </span>
            . You can update this at any time.
          </>
        );
      default:
        return <></>;
    }
  }

  /**
   * Render
   */

  if (connectedMember) {
    return (
      <>
        {delegationStatus !== '' && (
          <>
            <div className="memberprofile__action-description">
              {renderDelegationStatus()}
            </div>

            {/* OPEN DELEGATION MODAL BUTTON */}
            <button
              className="memberprofile__action-button"
              onClick={() => setShowDelegationModal(true)}>
              {delegationStatus}
            </button>
          </>
        )}

        {showDelegationModal && (
          <DelegationModal
            isOpen={showDelegationModal}
            closeHandler={() => {
              setShowDelegationModal(false);
            }}
            currentStep={currentStep}
          />
        )}
      </>
    );
  }

  return <></>;
}
