import {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm, Controller} from 'react-hook-form';
import {fromWei, toBN, toWei, toChecksumAddress} from 'web3-utils';
import {useHistory} from 'react-router-dom';
import {useSelector} from 'react-redux';

import {
  formatNumber,
  getValidationError,
  normalizeString,
  stripFormatNumber,
  truncateEthAddress,
} from '../../util/helpers';
import {useIsDefaultChain, useWeb3Modal} from '../../components/web3/hooks';
import {
  ContractAdapterNames,
  ContractDAOConfigKeys,
  Web3TxStatus,
} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {getDAOConfigEntry} from '../../components/web3/helpers';
import {isEthAddressValid} from '../../util/validation';
import {AsyncStatus} from '../../util/types';
import {UNITS_ADDRESS} from '../../config';
import {CycleEllipsis} from '../../components/feedback';
import {
  useCheckApplicant,
  useSignAndSubmitProposal,
} from '../../components/proposals/hooks';
import {StoreState} from '../../store/types';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
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

type SubmitActionArguments = [
  applicant: string, // `applicant`
  tokenToMint: string, // `tokenToMint`
  tokenAmount: string // `tokenAmount`
];

type OnboardingConfigs = {
  chunkSize: string;
  maximumChunks: string;
  unitsPerChunk: string;
};

const PLACEHOLDER = '\u2014'; /* em dash */

function renderUserAccountBalance(userAccountBalance: string | undefined) {
  if (!userAccountBalance) {
    return '---';
  }

  return formatNumber(userAccountBalance);
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
    return 'Connect your wallet to submit an onboarding proposal.';
  }

  // user is on wrong network
  if (defaultChainError) {
    return defaultChainError.message;
  }
}

function renderSubmitStatus(
  proposalSignAndSendStatus: Web3TxStatus
): React.ReactNode {
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
      return null;
  }
}

export default function CreateOnboardingProposal() {
  /**
   * Selectors
   */

  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();

  const {connected, account, web3Instance} = useWeb3Modal();

  const {
    proposalData,
    proposalSignAndSendError,
    proposalSignAndSendStatus,
    signAndSendProposal,
  } = useSignAndSubmitProposal<SnapshotType.draft>();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const history = useHistory();

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  const [userAccountBalance, setUserAccountBalance] = useState<string>();

  const [sliderStep, setSliderStep] = useState<number>();

  const [sliderMin, setSliderMin] = useState<number>();

  const [sliderMax, setSliderMax] = useState<number>();

  const [onboardingConfigs, setOnboardingConfigs] =
    useState<OnboardingConfigs>();

  /**
   * Variables
   */

  const {
    clearErrors,
    control,
    errors,
    getValues,
    register,
    setValue,
    trigger,
    watch,
  } = form;

  const ethAddressValue = watch(Fields.ethAddress);

  const ethAmountValue = watch(Fields.ethAmount);

  const createOnboardError = submitError || proposalSignAndSendError;

  const isConnected: boolean = connected && account ? true : false;

  const isInProcess =
    proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
    proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone = proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone;

  const {
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
  } = useCheckApplicant(ethAddressValue);

  const minUnitsText = onboardingConfigs
    ? formatNumber(onboardingConfigs.unitsPerChunk)
    : PLACEHOLDER;

  const minEthAmountText = onboardingConfigs
    ? formatNumber(fromWei(toBN(onboardingConfigs.chunkSize), 'ether'))
    : PLACEHOLDER;

  const maxUnitsText = onboardingConfigs
    ? formatNumber(
        String(
          toBN(onboardingConfigs.unitsPerChunk).mul(
            toBN(onboardingConfigs.maximumChunks)
          )
        )
      )
    : PLACEHOLDER;

  const maxEthAmountText = onboardingConfigs
    ? formatNumber(
        fromWei(
          toBN(onboardingConfigs.chunkSize).mul(
            toBN(onboardingConfigs.maximumChunks)
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
    onboardingConfigs,
    setValue,
  ]);

  const getOnboardingConfigsCached = useCallback(getOnboardingConfigs, [
    daoRegistryContract,
    defaultChainError,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getUserAccountBalanceCached();
  }, [getUserAccountBalanceCached]);

  // Set the value of `ethAddress` if the `account` changes
  useEffect(() => {
    if (defaultChainError) return;

    setValue(Fields.ethAddress, account && toChecksumAddress(account));
  }, [account, defaultChainError, setValue]);

  useEffect(() => {
    setSliderConfigsCached();
  }, [setSliderConfigsCached]);

  useEffect(() => {
    setSubmitError(undefined);
    clearErrors();
  }, [clearErrors, ethAddressValue]);

  useEffect(() => {
    getOnboardingConfigsCached();
  }, [getOnboardingConfigsCached]);

  /**
   * Functions
   */

  function setSliderConfigs() {
    try {
      if (!daoRegistryContract || !onboardingConfigs) {
        setSliderStep(undefined);
        setSliderMin(undefined);
        setSliderMax(undefined);
        setValue(Fields.ethAmount, PLACEHOLDER);

        return;
      }

      setSliderStep(Number(fromWei(onboardingConfigs.chunkSize, 'ether')));

      setSliderMax(
        Number(
          fromWei(
            toBN(onboardingConfigs.chunkSize).mul(
              toBN(onboardingConfigs.maximumChunks)
            ),
            'ether'
          )
        )
      );

      setSliderMin(Number(fromWei(onboardingConfigs.chunkSize, 'ether')));

      setValue(Fields.ethAmount, fromWei(onboardingConfigs.chunkSize, 'ether'));
    } catch (error) {
      setSliderStep(undefined);
      setSliderMin(undefined);
      setSliderMax(undefined);
      setValue(Fields.ethAmount, PLACEHOLDER);

      console.error(error);
    }
  }

  async function getOnboardingConfigs() {
    try {
      if (!daoRegistryContract || defaultChainError) return;

      const chunkSize = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.onboardingChunkSize,
          UNITS_ADDRESS
        )
      );

      const maximumChunks = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.onboardingMaximumChunks,
          UNITS_ADDRESS
        )
      );

      const unitsPerChunk = String(
        await getDAOConfigEntry(
          daoRegistryContract.instance,
          ContractDAOConfigKeys.onboardingUnitsPerChunk,
          UNITS_ADDRESS
        )
      );

      setOnboardingConfigs({
        chunkSize,
        maximumChunks,
        unitsPerChunk,
      });
    } catch (error) {
      console.error(error);

      setOnboardingConfigs(undefined);
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
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please make sure your wallet is connected.'
        );
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (checkApplicantError) {
        // Just log the error (don't throw) because it is not a blocker for the
        // snapshot draft to be submitted. The applicant address validity will
        // be checked again when the proposal is submitted onchain.
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

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      const {ethAddress, ethAmount} = values;
      const ethAddressToChecksum = toChecksumAddress(ethAddress);
      const ethAmountInWei = toWei(stripFormatNumber(ethAmount), 'ether');
      const proposerAddressToChecksum = toChecksumAddress(account);

      // Values needed to display relevant proposal amounts in the proposal
      // details page are set in the snapshot draft metadata. (We can no longer
      // rely on getting this data from onchain because the proposal may not
      // exist there yet.)
      const proposalAmountValues = {
        tributeAmount: ethAmount,
        tributeAmountUnit: 'ETH',
      };

      // Arguments needed to submit the proposal onchain are set in the snapshot
      // draft metadata.
      const submitActionArgs: SubmitActionArguments = [
        ethAddressToChecksum,
        UNITS_ADDRESS,
        ethAmountInWei,
      ];

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        const body =
          normalizeString(ethAddress) === normalizeString(account)
            ? `Onboarding ${truncateEthAddress(ethAddressToChecksum, 7)}.`
            : `Onboarding proposal from ${truncateEthAddress(
                proposerAddressToChecksum,
                7
              )} for applicant ${truncateEthAddress(ethAddressToChecksum, 7)}.`;

        // Sign and submit draft for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name: ethAddressToChecksum,
            body,
            metadata: {
              proposalAmountValues,
              submitActionArgs,
              accountAuthorizedToProcessPassedProposal:
                proposerAddressToChecksum,
            },
          },
          adapterName: ContractAdapterNames.onboarding,
          type: SnapshotType.draft,
        });

        proposalId = uniqueId;
      }

      // go to OnboardingDetails page for newly created member proposal
      history.push(`/onboarding/${proposalId}`);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

  // Render unauthorized message
  if (!isConnected || defaultChainError) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>{renderUnauthorizedMessage({defaultChainError, isConnected})}</p>
        </div>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <div className="form__description">
        <p>
          Submit a proposal to join Tribute DAO. Each member can purchase{' '}
          {minUnitsText} units for {minEthAmountText} ETH (up to {maxUnitsText}{' '}
          units for {maxEthAmountText} ETH). Please put your preferred ETH
          address below and the amount of ETH you&apos;d like to contribute.
        </p>
        <p>
          Following your submission, existing members will consider your
          proposal. If approved by vote, your proposal will be processed and you
          will finalize the transfer of your allocated ETH in exchange for
          membership units.
        </p>
      </div>

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        {/* ETH ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label" htmlFor={Fields.ethAddress}>
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
                  data-testid="onboarding-slider"
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
          </div>
          <div className="form__input-addon">{ethAmountValue} ETH</div>
        </div>

        {/* SUBMIT */}
        <button
          aria-label={isInProcess ? 'Submitting your proposal.' : ''}
          className="button"
          disabled={isInProcessOrDone}
          onClick={
            isInProcessOrDone
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
            {renderSubmitStatus(proposalSignAndSendStatus)}
          </div>
        )}

        {/* SUBMIT ERROR */}
        {createOnboardError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while submitting the proposal."
              error={createOnboardError}
            />
          </div>
        )}
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
          <h2 className="titlebar__title">Onboard</h2>
        </div>

        <div className="form-wrapper">
          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
