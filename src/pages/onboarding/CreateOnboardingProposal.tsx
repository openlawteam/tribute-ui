import {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm, Controller} from 'react-hook-form';
import {AbiItem, fromWei, toBN, toWei, toChecksumAddress} from 'web3-utils';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {useHistory} from 'react-router-dom';
import {useSelector} from 'react-redux';

import {
  formatNumber,
  getValidationError,
  normalizeString,
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
import {
  ETH_TOKEN_ADDRESS,
  ONBOARDING_TOKEN_ADDRESS,
  UNITS_ADDRESS,
} from '../../config';
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
  amount = 'amount',
}

type FormInputs = {
  ethAddress: string;
  amount: string;
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

type ERC20Details = {
  symbol: string;
  decimals: number;
};

const PLACEHOLDER = '\u2014'; /* em dash */

const isERC20Onboarding = ONBOARDING_TOKEN_ADDRESS !== ETH_TOKEN_ADDRESS;

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
    return (
      <div className="proposalcard">
        <div className="proposalcard__content">
          <p>
            CineCapsule DAO aims to bring together members who wish to support
            the work of Independent Film Festivals. CineCapsule DAO will have up
            to a certain number of initial members, who will pool their capital
            to make investments. Each member can buy with DAO tokens. Please
            enter your preferred wallet address below and the amount of ETH you
            wish to contribute to CineCapsule DAO. Once you complete this form,
            you will be fully onboarded and will receive information about the
            weekly CineCapsule DAO call and its Discord community.
          </p>
          <p style={{color: '#697FD4'}}>Connect your wallet to get started.</p>
        </div>
      </div>
    );
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

  const [erc20Contract, setERC20Contract] = useState<Web3Contract>();

  const [erc20Details, setERC20Details] = useState<ERC20Details>();

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

  const amountValue = watch(Fields.amount);

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

  const minAmountText = sliderMin ? formatNumber(sliderMin) : PLACEHOLDER;

  const maxUnitsText = onboardingConfigs
    ? formatNumber(
        String(
          toBN(onboardingConfigs.unitsPerChunk).mul(
            toBN(onboardingConfigs.maximumChunks)
          )
        )
      )
    : PLACEHOLDER;

  const maxAmountText = sliderMax ? formatNumber(sliderMax) : PLACEHOLDER;

  const amountUnit = isERC20Onboarding ? erc20Details?.symbol : 'ETH';

  /**
   * Cached callbacks
   */

  const getUserAccountBalanceCached = useCallback(getUserAccountBalance, [
    account,
    defaultChainError,
    erc20Contract,
    web3Instance,
  ]);

  const setSliderConfigsCached = useCallback(setSliderConfigs, [
    daoRegistryContract,
    defaultChainError,
    erc20Details,
    onboardingConfigs,
    setValue,
  ]);

  const getOnboardingConfigsCached = useCallback(getOnboardingConfigs, [
    daoRegistryContract,
    defaultChainError,
  ]);

  const getERC20ContractCached = useCallback(getERC20Contract, [
    defaultChainError,
    web3Instance,
  ]);

  const getERC20DetailsCached = useCallback(getERC20Details, [
    defaultChainError,
    erc20Contract,
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

  useEffect(() => {
    if (isERC20Onboarding) {
      getERC20ContractCached();
    }
  }, [getERC20ContractCached]);

  useEffect(() => {
    if (isERC20Onboarding) {
      getERC20DetailsCached();
    }
  }, [getERC20DetailsCached]);

  /**
   * Functions
   */

  async function getERC20Contract() {
    if (!web3Instance || defaultChainError) {
      setERC20Contract(undefined);
      return;
    }

    try {
      if (!ONBOARDING_TOKEN_ADDRESS) {
        throw new Error(
          'No Onboarding ERC20 address was found. Are you sure it is set?'
        );
      }

      const {default: lazyERC20ABI} = await import(
        '../../abis/external/ERC20.json'
      );
      const erc20Contract: AbiItem[] = lazyERC20ABI as any;
      const instance = new web3Instance.eth.Contract(
        erc20Contract,
        ONBOARDING_TOKEN_ADDRESS
      );

      setERC20Contract(instance);
    } catch (error) {
      console.error(error);
      setERC20Contract(undefined);
    }
  }

  async function getERC20Details() {
    if (!erc20Contract || defaultChainError) {
      setERC20Details(undefined);
      return;
    }

    try {
      const symbol = await erc20Contract.methods.symbol().call();
      const decimals = await erc20Contract.methods.decimals().call();
      setERC20Details({symbol, decimals: Number(decimals)});
    } catch (error) {
      console.error(error);
      setERC20Details(undefined);
    }
  }

  function setSliderConfigs() {
    try {
      if (!daoRegistryContract || defaultChainError || !onboardingConfigs) {
        setSliderStep(undefined);
        setSliderMin(undefined);
        setSliderMax(undefined);
        setValue(Fields.amount, PLACEHOLDER);

        return;
      }

      if (isERC20Onboarding) {
        // ERC20 onboarding
        if (!erc20Details) {
          setSliderStep(undefined);
          setSliderMin(undefined);
          setSliderMax(undefined);
          setValue(Fields.amount, PLACEHOLDER);

          return;
        }

        const divisor = toBN(10).pow(toBN(erc20Details.decimals));
        const beforeDecimal = toBN(onboardingConfigs.chunkSize).div(divisor);
        const afterDecimal = toBN(onboardingConfigs.chunkSize).mod(divisor);
        const stepAmount: number = afterDecimal.eq(toBN(0))
          ? Number(String(beforeDecimal))
          : Number(`${String(beforeDecimal)}.${String(afterDecimal)}`);
        setSliderStep(stepAmount);

        setSliderMax(stepAmount * Number(onboardingConfigs.maximumChunks));

        setSliderMin(stepAmount);

        setValue(Fields.amount, String(stepAmount));
      } else {
        // ETH onboarding
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

        setValue(Fields.amount, fromWei(onboardingConfigs.chunkSize, 'ether'));
      }
    } catch (error) {
      setSliderStep(undefined);
      setSliderMin(undefined);
      setSliderMax(undefined);
      setValue(Fields.amount, PLACEHOLDER);

      console.error(error);
    }
  }

  async function getOnboardingConfigs() {
    try {
      if (!daoRegistryContract || defaultChainError) return;

      const chunkSize = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.onboardingChunkSize,
        UNITS_ADDRESS
      );
      const maximumChunks = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.onboardingMaximumChunks,
        UNITS_ADDRESS
      );
      const unitsPerChunk = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.onboardingUnitsPerChunk,
        UNITS_ADDRESS
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
    try {
      if (!account || defaultChainError) {
        setUserAccountBalance(undefined);

        return;
      }

      if (isERC20Onboarding) {
        // ERC20 onboarding
        if (!erc20Contract) {
          setUserAccountBalance(undefined);

          return;
        }

        const balance = await erc20Contract.methods.balanceOf(account).call();
        const balanceBN = toBN(balance);
        const decimals = await erc20Contract.methods.decimals().call();
        const divisor = toBN(10).pow(toBN(decimals));
        const beforeDecimal = balanceBN.div(divisor);
        const afterDecimal = balanceBN.mod(divisor);
        const balanceReadable = afterDecimal.eq(toBN(0))
          ? String(beforeDecimal)
          : `${String(beforeDecimal)}.${String(afterDecimal)}`;

        setUserAccountBalance(balanceReadable);
      } else {
        // ETH onboarding
        if (!web3Instance) {
          setUserAccountBalance(undefined);

          return;
        }

        // Ether wallet balance
        setUserAccountBalance(
          web3Instance.utils.fromWei(
            await web3Instance.eth.getBalance(account),
            'ether'
          )
        );
      }
    } catch (error) {
      console.error(error);
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

      const {ethAddress, amount} = values;
      const ethAddressToChecksum = toChecksumAddress(ethAddress);
      const proposerAddressToChecksum = toChecksumAddress(account);

      let amountArg = '';

      if (isERC20Onboarding) {
        // ERC20 onboarding
        if (!erc20Details) {
          throw new Error('No ERC20 details found.');
        }

        if (!Number.isInteger(Number(amount))) {
          throw new Error('The amount must be an integer for an ERC20 token.');
        }

        const multiplier = toBN(10).pow(toBN(erc20Details.decimals));
        const erc20AmountWithDecimals = toBN(amount).mul(multiplier);

        amountArg = String(erc20AmountWithDecimals);
      } else {
        // ETH onboarding
        const ethAmountInWei = toWei(amount, 'ether');

        amountArg = ethAmountInWei;
      }

      // Values needed to display relevant proposal amounts in the proposal
      // details page are set in the snapshot draft metadata. (We can no longer
      // rely on getting this data from onchain because the proposal may not
      // exist there yet.)
      const proposalAmountValues = {
        tributeAmount: formatNumber(amount),
        tributeAmountUnit: amountUnit,
      };

      // Arguments needed to submit the proposal onchain are set in the snapshot
      // draft metadata.
      const submitActionArgs: SubmitActionArguments = [
        ethAddressToChecksum,
        UNITS_ADDRESS,
        amountArg,
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
      const e = error as Error;

      setSubmitError(e);
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
      <div className="section-wrapper1">
        <div className="proposalcard">
          <div className="form__description">
            <p>
              To become a member of CineCapsule, each member can purchase{' '}
              {minUnitsText} units for {minAmountText} {amountUnit} (up to{' '}
              {maxUnitsText} units for {maxAmountText} {amountUnit}). Please put
              your preferred ETH address below and the amount of {amountUnit}{' '}
              you&apos;d like to contribute.
            </p>
            <p>
              Following your submission, existing members will consider your
              proposal. If approved by vote, your proposal will be processed and
              you will finalize the transfer of your allocated {amountUnit} in
              exchange for membership units.
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

            {/* AMOUNT SLIDER */}
            <div className="form__input-row">
              <label
                className="form__input-row-label"
                htmlFor={Fields.amount}
                id={`${Fields.amount}-label`}>
                Amount
              </label>
              <div className="form__input-row-fieldwrap--narrow">
                <Controller
                  render={({onChange}) => (
                    <Slider
                      data-testid="onboarding-slider"
                      aria-labelledby={`${Fields.amount}-label`}
                      defaultValue={sliderMin || 0}
                      id={Fields.amount}
                      max={sliderMax || 0}
                      min={sliderMin || 0}
                      step={sliderStep || 0}
                      onChange={onChange}
                      disabled={isInProcessOrDone}
                    />
                  )}
                  defaultValue={sliderMin || 0}
                  control={control}
                  name={Fields.amount}
                  rules={{
                    validate: (value: string): string | boolean => {
                      const amount = Number(value);

                      return amount > Number(userAccountBalance)
                        ? `Insufficient funds. ${renderUserAccountBalance(
                            userAccountBalance
                          )} ${amountUnit} available.`
                        : true;
                    },
                  }}
                />

                <InputError
                  error={getValidationError(Fields.amount, errors)}
                  id={`error-${Fields.amount}`}
                />
              </div>
              <div className="form__input-addon">
                {formatNumber(amountValue)} {amountUnit}
              </div>
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
                  detailsProps={{open: true}}
                />
              </div>
            )}
          </form>
        </div>
      </div>
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
          <h2 className="titlebar__title">BECOME A MEMBER</h2>
        </div>
        <br></br>

        <div className="form-wrapper">
          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
