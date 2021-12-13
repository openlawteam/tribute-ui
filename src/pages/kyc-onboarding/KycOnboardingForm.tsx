import {fromWei, toBN} from 'web3-utils';
import {toChecksumAddress, toWei} from 'web3-utils';
import {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useForm, Controller} from 'react-hook-form';

import {
  formatDecimal,
  formatNumber,
  getValidationError,
  normalizeString,
  stripFormatNumber,
} from '../../util/helpers';
import {featureFlags} from '../../util/features';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../../components/web3/hooks';
import {AsyncStatus} from '../../util/types';
import {ContractDAOConfigKeys, Web3TxStatus} from '../../components/web3/types';
import {CycleEllipsis} from '../../components/feedback';
import {FormFieldErrors} from '../../util/enums';
import {getConnectedMember} from '../../store/actions';
import {getDAOConfigEntry} from '../../components/web3/helpers';
import {isEthAddressValid} from '../../util/validation';
import {ETH_TOKEN_ADDRESS, KYC_FORMS_URL} from '../../config';
import {ReduxDispatch, StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {useCheckApplicant} from '../../components/proposals/hooks';
import {useDaoTokenDetails} from '../../components/dao-token/hooks';
import {useVerifyKYCApplicant} from '../../components/kyc-onboarding';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import EtherscanURL from '../../components/web3/EtherscanURL';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Slider from '../../components/common/Slider';
import Wrap from '../../components/common/Wrap';

enum Fields {
  ethAddress = 'ethAddress',
  ethAmount = 'ethAmount',
}

type FormInputs = {
  ethAddress: string;
  ethAmount: string;
};

type OnboardArguments = [
  dao: string, // `dao`
  kycedMember: string, // `kycedMember`
  signature: string // `signature`
];

type KycOnboardingConfigs = {
  chunkSize: string;
  maximumChunks: string;
  maxMembers: string;
  unitsPerChunk: string;
};

const PLACEHOLDER = '\u2014'; /* em dash */

function renderUserAccountBalance(userAccountBalance: string | undefined) {
  if (!userAccountBalance) {
    return '---';
  }

  const balanceToNumber: number = Number(userAccountBalance);

  return Number.isInteger(balanceToNumber)
    ? userAccountBalance
    : formatDecimal(balanceToNumber);
}

function renderUnauthorizedMessage({
  defaultChainError,
  isConnected,
}: {
  defaultChainError: Error | undefined;
  isConnected: boolean;
}) {
  // user is not connected
  if (!isConnected) {
    return 'Connect your wallet to get started.';
  }

  // user is on wrong network
  if (defaultChainError) {
    return defaultChainError.message;
  }
}

function renderSubmitStatus({
  txEtherscanURL,
  txStatus,
}: {
  txEtherscanURL: string;
  txStatus: Web3TxStatus;
}): React.ReactNode {
  switch (txStatus) {
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
          <div>Onboarding done!</div>

          <EtherscanURL url={txEtherscanURL} />
        </>
      );
    default:
      return null;
  }
}

export default function KycOnboardingForm() {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  const kycOnboardingContract = useSelector(
    (s: StoreState) => s.contracts.KycOnboardingContract
  );

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();

  const {connected, account, web3Instance} = useWeb3Modal();

  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();

  const {average: gasPrice} = useETHGasPrice();

  const {daoTokenDetails} = useDaoTokenDetails();

  const {
    kycCheckCertificate,
    kycCheckError,
    kycCheckMessageJSX,
    kycCheckStatus,
    setKYCCheckETHAddress,
    setKYCCheckRedirect,
  } = useVerifyKYCApplicant();

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

  const [userAccountBalance, setUserAccountBalance] = useState<string>();

  const [sliderStep, setSliderStep] = useState<number>();

  const [sliderMin, setSliderMin] = useState<number>();

  const [sliderMax, setSliderMax] = useState<number>();

  const [kycOnboardingConfigs, setKycOnboardingConfigs] =
    useState<KycOnboardingConfigs>();

  /**
   * Variables
   */

  const {
    clearErrors,
    control,
    errors,
    getValues,
    setValue,
    register,
    trigger,
    watch,
  } = form;

  const ethAddressValue = watch(Fields.ethAddress);

  const ethAmountValue = watch(Fields.ethAmount);

  const kycOnboardingError = submitError;

  const isConnected: boolean = connected && account ? true : false;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  const submitDisabled: boolean =
    !kycCheckCertificate ||
    isInProcessOrDone ||
    kycCheckStatus === AsyncStatus.PENDING ||
    kycCheckStatus === AsyncStatus.REJECTED;

  const {
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
  } = useCheckApplicant(ethAddressValue);

  const maxMembersText = kycOnboardingConfigs
    ? formatNumber(Number(kycOnboardingConfigs.maxMembers) - 2) // accounts for config being set to max actual members + 1 DAO creator + 1 DaoFactory
    : PLACEHOLDER;

  const minUnitsText = kycOnboardingConfigs
    ? formatNumber(kycOnboardingConfigs.unitsPerChunk)
    : PLACEHOLDER;

  const minEthAmountText = kycOnboardingConfigs
    ? formatNumber(fromWei(toBN(kycOnboardingConfigs.chunkSize), 'ether'))
    : PLACEHOLDER;

  const maxUnitsText = kycOnboardingConfigs
    ? formatNumber(
        String(
          toBN(kycOnboardingConfigs.unitsPerChunk).mul(
            toBN(kycOnboardingConfigs.maximumChunks)
          )
        )
      )
    : PLACEHOLDER;

  const maxEthAmountText = kycOnboardingConfigs
    ? formatNumber(
        fromWei(
          toBN(kycOnboardingConfigs.chunkSize).mul(
            toBN(kycOnboardingConfigs.maximumChunks)
          ),
          'ether'
        )
      )
    : PLACEHOLDER;

  /**
   * Cached callbacks
   */

  const getUserAccountBalanceCached = useCallback(getUserAccountBalance, [
    account,
    web3Instance,
  ]);

  const setSliderConfigsCached = useCallback(setSliderConfigs, [
    daoRegistryContract,
    kycCheckCertificate,
    kycOnboardingConfigs,
    setValue,
  ]);

  const getKycOnboardingConfigsCached = useCallback(getKycOnboardingConfigs, [
    daoRegistryContract,
    defaultChainError,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getUserAccountBalanceCached();
  }, [getUserAccountBalanceCached, isDone]);

  // Set the value of `ethAddress` if the `account` changes
  useEffect(() => {
    if (defaultChainError) return;

    setValue(Fields.ethAddress, account && toChecksumAddress(account));
  }, [account, defaultChainError, setValue]);

  // Set the address to check JTC
  useEffect(() => {
    setKYCCheckETHAddress(ethAddressValue);
  }, [ethAddressValue, setKYCCheckETHAddress]);

  // Set the redirect URL to the KYC form.
  useEffect(() => {
    if (!ethAddressValue || !KYC_FORMS_URL || defaultChainError) {
      return;
    }

    setKYCCheckRedirect(KYC_FORMS_URL);
  }, [defaultChainError, ethAddressValue, setKYCCheckRedirect]);

  useEffect(() => {
    setSliderConfigsCached();
  }, [setSliderConfigsCached, kycCheckCertificate]);

  useEffect(() => {
    setSubmitError(undefined);
    clearErrors();
  }, [clearErrors, ethAddressValue]);

  useEffect(() => {
    getKycOnboardingConfigsCached();
  }, [getKycOnboardingConfigsCached]);

  /**
   * Functions
   */

  function setSliderConfigs() {
    try {
      if (
        !daoRegistryContract ||
        !kycCheckCertificate ||
        !kycOnboardingConfigs
      ) {
        setSliderStep(undefined);
        setSliderMin(undefined);
        setSliderMax(undefined);
        setValue(Fields.ethAmount, PLACEHOLDER);

        return;
      }

      setSliderStep(Number(fromWei(kycOnboardingConfigs.chunkSize, 'ether')));

      setSliderMax(
        Number(
          fromWei(
            toBN(kycOnboardingConfigs.chunkSize).mul(
              toBN(kycOnboardingConfigs.maximumChunks)
            ),
            'ether'
          )
        )
      );

      setSliderMin(Number(fromWei(kycOnboardingConfigs.chunkSize, 'ether')));

      setValue(
        Fields.ethAmount,
        fromWei(kycOnboardingConfigs.chunkSize, 'ether')
      );
    } catch (error) {
      setSliderStep(undefined);
      setSliderMin(undefined);
      setSliderMax(undefined);
      setValue(Fields.ethAmount, PLACEHOLDER);

      console.error(error);
    }
  }

  async function getKycOnboardingConfigs() {
    try {
      if (!daoRegistryContract || defaultChainError) return;

      const chunkSize = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.kycOnboardingChunkSize,
          ETH_TOKEN_ADDRESS
        )
      );

      const maximumChunks = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.kycOnboardingMaximumChunks,
          ETH_TOKEN_ADDRESS
        )
      );

      const maxMembers = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.kycOnboardingMaxMembers,
          ETH_TOKEN_ADDRESS
        )
      );

      const unitsPerChunk = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.kycOnboardingUnitsPerChunk,
          ETH_TOKEN_ADDRESS
        )
      );

      setKycOnboardingConfigs({
        chunkSize,
        maximumChunks,
        maxMembers,
        unitsPerChunk,
      });
    } catch (error) {
      console.error(error);

      setKycOnboardingConfigs(undefined);
    }
  }

  async function getUserAccountBalance() {
    if (!web3Instance || !account) {
      setUserAccountBalance(undefined);

      return;
    }

    try {
      // Ether wallet balance
      setUserAccountBalance(
        web3Instance.utils.fromWei(
          await web3Instance.eth.getBalance(account),
          'ether'
        )
      );
    } catch (error) {
      setUserAccountBalance(undefined);
    }
  }

  async function handleSubmit(values: FormInputs) {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!kycOnboardingContract) {
        throw new Error('No KYC Onboarding contract was found.');
      }

      if (!isConnected) {
        throw new Error(
          'No user account was found. Please make sure your wallet is connected.'
        );
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (checkApplicantError) {
        // Just log the error (don't throw). The applicant address validity will
        // be checked as part of the `onboard` tx (via the internal
        // `potentialNewMemebr` call).
        console.warn(
          `Error checking if the applicant address is valid: ${checkApplicantError.message}`
        );
      }

      if (
        checkApplicantStatus === AsyncStatus.FULFILLED &&
        !isApplicantValid &&
        checkApplicantInvalidMsg
      ) {
        throw new Error(checkApplicantInvalidMsg);
      }

      if (!kycCheckCertificate) {
        throw new Error('No KYC validation certificate found.');
      }

      // If the whitelist flag is set, check if the verified address is
      // whitelisted
      if (
        featureFlags?.joinIsWhitelisted &&
        !kycCheckCertificate.isWhitelisted
      ) {
        throw new Error(
          'The applicant address has been KYC verified, but has not been authorized to join yet.'
        );
      }

      const {ethAddress, ethAmount} = values;
      const ethAddressToChecksum = toChecksumAddress(ethAddress);
      const ethAmountInWei = toWei(stripFormatNumber(ethAmount), 'ether');

      const onboardArguments: OnboardArguments = [
        daoRegistryContract.contractAddress,
        ethAddressToChecksum,
        kycCheckCertificate.signature,
      ];

      const txArguments = {
        from: account || '',
        value: ethAmountInWei,
        ...(gasPrice ? {gasPrice} : null),
      };

      const txReceipt = await txSend(
        'onboardEth',
        kycOnboardingContract.instance.methods,
        onboardArguments,
        txArguments
      );

      if (txReceipt) {
        // if connected account is the applicant (the address that will receive
        // the membership units)
        if (normalizeString(ethAddress) === normalizeString(account)) {
          // re-fetch member
          await dispatch(
            getConnectedMember({
              account,
              daoRegistryContract,
              web3Instance,
            })
          );

          // suggest adding DAO token to wallet
          await addTokenToWallet();
        }
      }
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      const e = error as Error;

      let errorToSet: Error = e;

      if (e?.message?.includes('already member')) {
        errorToSet = new Error('The applicant address is already a member.');
      }

      setSubmitError(errorToSet);
    }
  }

  async function addTokenToWallet() {
    if (!daoTokenDetails) return;

    try {
      await window?.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: daoTokenDetails,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Render
   */

  // Render unauthorized message
  if (!isConnected || defaultChainError) {
    return (
      <Wrap className="section-wrapper">
        <FadeIn>
          <div className="titlebar">
            <h2 className="titlebar__title">Join</h2>
          </div>

          <div className="form-wrapper">
            <div className="form__description">
              <p>
                Tribute DAO will have up to {maxMembersText} initial members.
                Each member can purchase {minUnitsText} units for{' '}
                {minEthAmountText} ETH (up to {maxUnitsText} units for{' '}
                {maxEthAmountText} ETH).
              </p>
              <p>
                Please put your preferred ETH address below and the amount of
                ETH you&apos;d like to contribute.
              </p>
            </div>

            <div className="form__description--unauthorized">
              <p>
                {renderUnauthorizedMessage({defaultChainError, isConnected})}
              </p>
            </div>
          </div>
        </FadeIn>
      </Wrap>
    );
  }

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Join</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            {/* KYC CHECK STATUS MESSAGE */}
            {kycCheckMessageJSX && (
              <div className="form__header">
                <FadeIn>
                  <p>{kycCheckMessageJSX}</p>
                </FadeIn>
              </div>
            )}

            <p>
              Tribute DAO will have up to {maxMembersText} initial members. Each
              member can purchase {minUnitsText} units for {minEthAmountText}{' '}
              ETH (up to {maxUnitsText} units for {maxEthAmountText} ETH).
            </p>
            <p>
              Please put your preferred ETH address below and the amount of ETH
              you&apos;d like to contribute.
            </p>
          </div>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            {/* ETH ADDRESS */}
            <div className="form__input-row">
              <label
                className="form__input-row-label"
                htmlFor={Fields.ethAddress}>
                Applicant Address
              </label>
              <div className="form__input-row-fieldwrap">
                {/* @note We don't need the default value as it's handled in the useEffect above. */}
                <input
                  aria-describedby={`error-${Fields.ethAddress}`}
                  aria-invalid={errors.ethAddress ? 'true' : 'false'}
                  id={Fields.ethAddress}
                  name={Fields.ethAddress}
                  ref={register({
                    validate: (ethAddress: string): string | boolean => {
                      return !ethAddress
                        ? FormFieldErrors.REQUIRED
                        : !isEthAddressValid(ethAddress)
                        ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                        : true;
                    },
                  })}
                  type="text"
                  disabled={isInProcessOrDone}
                />

                <InputError
                  error={getValidationError(Fields.ethAddress, errors)}
                  id={`error-${Fields.ethAddress}`}
                />
              </div>
            </div>

            {/* ETH AMOUNT SLIDER */}
            <div className="form__input-row">
              <label
                className="form__input-row-label"
                htmlFor={Fields.ethAmount}
                id={`${Fields.ethAmount}-label`}>
                Amount
              </label>
              <div className="form__input-row-fieldwrap--narrow">
                <Controller
                  render={({onChange}) => (
                    <Slider
                      aria-labelledby={`${Fields.ethAmount}-label`}
                      defaultValue={sliderMin || 0}
                      id={Fields.ethAmount}
                      max={sliderMax || 0}
                      min={sliderMin || 0}
                      step={sliderStep || 0}
                      onChange={onChange}
                      disabled={isInProcessOrDone}
                    />
                  )}
                  defaultValue={sliderMin || 0}
                  control={control}
                  name={Fields.ethAmount}
                  rules={{
                    validate: (value: string): string | boolean => {
                      const amount = Number(stripFormatNumber(value));

                      return amount >= Number(userAccountBalance)
                        ? `Insufficient funds. ${renderUserAccountBalance(
                            userAccountBalance
                          )} ETH available.`
                        : true;
                    },
                  }}
                />

                <InputError
                  error={getValidationError(Fields.ethAmount, errors)}
                  id={`error-${Fields.ethAmount}`}
                />

                {/* <div className="form__input-description">
              The minimum amount is set based on the entity type of the KYC
              verified applicant address.
            </div> */}
              </div>
              <div className="form__input-addon">{ethAmountValue} ETH</div>
            </div>

            {/* SUBMIT */}
            <button
              aria-label={isInProcess ? 'Submitting your proposal.' : ''}
              className="button"
              disabled={submitDisabled}
              onClick={
                submitDisabled
                  ? () => {}
                  : async () => {
                      if (!(await trigger())) {
                        return;
                      }

                      handleSubmit(getValues());
                    }
              }
              type="submit">
              {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
            </button>

            {/* SUBMIT STATUS */}
            {isInProcessOrDone && (
              <div className="form__submit-status-container">
                {renderSubmitStatus({txEtherscanURL, txStatus})}
              </div>
            )}

            {/* SUBMIT ERROR */}
            {kycOnboardingError && (
              <div className="form__submit-error-container">
                <ErrorMessageWithDetails
                  renderText="Something went wrong with the submission."
                  error={kycOnboardingError}
                  detailsProps={{open: true}}
                />
              </div>
            )}

            {/* KYC CHECK ERROR */}
            {kycCheckError && (
              <div className="form__submit-error-container">
                <ErrorMessageWithDetails
                  renderText="There is a KYC check error."
                  error={kycCheckError}
                  detailsProps={{open: true}}
                />
              </div>
            )}
          </form>
        </div>
      </FadeIn>
    </Wrap>
  );
}
