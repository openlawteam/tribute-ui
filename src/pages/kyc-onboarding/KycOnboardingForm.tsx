import {AbiItem, fromWei, toBN} from 'web3-utils';
import {toChecksumAddress, toWei} from 'web3-utils';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useForm, Controller} from 'react-hook-form';

import {
  formatNumber,
  getValidationError,
  normalizeString,
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
import {
  ETH_TOKEN_ADDRESS,
  KYC_FORMS_URL,
  ONBOARDING_TOKEN_ADDRESS,
} from '../../config';
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
  amount = 'amount',
}

type FormInputs = {
  ethAddress: string;
  amount: string;
};

type OnboardEthArguments = [
  dao: string, // `dao`
  kycedMember: string, // `kycedMember`
  signature: string // `signature`
];

type OnboardERC20Arguments = [
  dao: string, // `dao`
  kycedMember: string, // `kycedMember`
  tokenAddr: string, // `tokenAddr`
  amount: string, // `amount`
  signature: string // `signature`
];

type TokenApproveArguments = [
  spender: string, // `spender`
  amount: string // `amount`
];

type KycOnboardingConfigs = {
  chunkSize: string;
  maximumChunks: string;
  maxMembers: string;
  unitsPerChunk: string;
};

type ERC20Details = {
  symbol: string;
  decimals: number;
};

type BN = ReturnType<typeof toBN>;

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
  txEtherscanURLTokenApprove,
  txStatusTokenApprove,
}: {
  txEtherscanURL: string;
  txStatus: Web3TxStatus;
  txEtherscanURLTokenApprove: string;
  txStatusTokenApprove: string;
}): React.ReactNode {
  // token approve transaction statuses
  if (txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM) {
    return (
      <>
        Confirm to transfer your tokens
        <CycleEllipsis intervalMs={500} />
      </>
    );
  }

  if (txStatusTokenApprove === Web3TxStatus.PENDING) {
    return (
      <>
        <div>
          Approving your tokens for transfer
          <CycleEllipsis intervalMs={500} />
        </div>

        <EtherscanURL url={txEtherscanURLTokenApprove} isPending />
      </>
    );
  }

  // onboard transaction statuses
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

  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  const isAddressDelegated = useSelector(
    (s: StoreState) => s.connectedMember?.isAddressDelegated
  );

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();

  const {connected, account, web3Instance} = useWeb3Modal();

  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();

  const {
    txEtherscanURL: txEtherscanURLTokenApprove,
    txIsPromptOpen: txIsPromptOpenTokenApprove,
    txSend: txSendTokenApprove,
    txStatus: txStatusTokenApprove,
  } = useContractSend();

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

  const kycOnboardingError = submitError;

  const isConnected: boolean = connected && account ? true : false;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM ||
    txStatusTokenApprove === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone =
    isInProcess || isDone || txIsPromptOpen || txIsPromptOpenTokenApprove;

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

  const minAmountText = sliderMin ? formatNumber(sliderMin) : PLACEHOLDER;

  const maxUnitsText = kycOnboardingConfigs
    ? formatNumber(
        String(
          toBN(kycOnboardingConfigs.unitsPerChunk).mul(
            toBN(kycOnboardingConfigs.maximumChunks)
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
    kycOnboardingConfigs,
    setValue,
  ]);

  const getKycOnboardingConfigsCached = useCallback(getKycOnboardingConfigs, [
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
      if (!daoRegistryContract || defaultChainError || !kycOnboardingConfigs) {
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
        const beforeDecimal = toBN(kycOnboardingConfigs.chunkSize).div(divisor);
        const afterDecimal = toBN(kycOnboardingConfigs.chunkSize).mod(divisor);
        const stepAmount: number = afterDecimal.eq(toBN(0))
          ? Number(String(beforeDecimal))
          : Number(`${String(beforeDecimal)}.${String(afterDecimal)}`);
        setSliderStep(stepAmount);

        setSliderMax(stepAmount * Number(kycOnboardingConfigs.maximumChunks));

        setSliderMin(stepAmount);

        setValue(Fields.amount, String(stepAmount));
      } else {
        // ETH onboarding
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
          Fields.amount,
          fromWei(kycOnboardingConfigs.chunkSize, 'ether')
        );
      }
    } catch (error) {
      setSliderStep(undefined);
      setSliderMin(undefined);
      setSliderMax(undefined);
      setValue(Fields.amount, PLACEHOLDER);

      console.error(error);
    }
  }

  async function getKycOnboardingConfigs() {
    try {
      if (!daoRegistryContract || defaultChainError) return;

      const chunkSize = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.kycOnboardingChunkSize,
        ONBOARDING_TOKEN_ADDRESS
      );
      const maximumChunks = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.kycOnboardingMaximumChunks,
        ONBOARDING_TOKEN_ADDRESS
      );
      const maxMembers = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.kycOnboardingMaxMembers,
        ONBOARDING_TOKEN_ADDRESS
      );
      const unitsPerChunk = await getDAOConfigEntry(
        daoRegistryContract.instance,
        ContractDAOConfigKeys.kycOnboardingUnitsPerChunk,
        ONBOARDING_TOKEN_ADDRESS
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

  async function handleSubmitTokenApprove(erc20AmountWithDecimals: BN) {
    try {
      if (!kycOnboardingContract) {
        throw new Error('No KYC Onboarding contract was found.');
      }

      if (!erc20Contract) {
        throw new Error('No ERC20Contract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      // Value to check if adapter is allowed to spend amount of tokens on
      // behalf of owner. If allowance is not sufficient, the owner will approve
      // the adapter to spend the amount of tokens needed for the owner to
      // provide the full onboarding amount.
      const allowance = await erc20Contract.methods
        .allowance(account, kycOnboardingContract.contractAddress)
        .call();

      const allowanceBN = toBN(allowance);

      if (erc20AmountWithDecimals.gt(allowanceBN)) {
        const difference = erc20AmountWithDecimals.sub(allowanceBN);
        const approveAmount = allowanceBN.add(difference);
        const tokenApproveArguments: TokenApproveArguments = [
          kycOnboardingContract.contractAddress,
          String(approveAmount),
        ];
        const txArguments = {
          from: account || '',
          ...(gasPrice ? {gasPrice} : null),
        };

        // Execute contract call for `approve`
        await txSendTokenApprove(
          'approve',
          erc20Contract.methods,
          tokenApproveArguments,
          txArguments
        );
      }
    } catch (error) {
      throw error;
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
        // `potentialNewMember` call).
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

      if (isActiveMember || isAddressDelegated) {
        throw new Error('The applicant address is already a member.');
      }

      const {ethAddress, amount} = values;
      const ethAddressToChecksum = toChecksumAddress(ethAddress);

      let txReceipt;

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

        await handleSubmitTokenApprove(erc20AmountWithDecimals);

        const onboardERC20Arguments: OnboardERC20Arguments = [
          daoRegistryContract.contractAddress,
          ethAddressToChecksum,
          ONBOARDING_TOKEN_ADDRESS,
          String(erc20AmountWithDecimals),
          kycCheckCertificate.signature,
        ];

        const txArguments = {
          from: account || '',
          ...(gasPrice ? {gasPrice} : null),
        };

        txReceipt = await txSend(
          'onboard',
          kycOnboardingContract.instance.methods,
          onboardERC20Arguments,
          txArguments
        );
      } else {
        // ETH onboarding
        const ethAmountInWei = toWei(amount, 'ether');

        const onboardEthArguments: OnboardEthArguments = [
          daoRegistryContract.contractAddress,
          ethAddressToChecksum,
          kycCheckCertificate.signature,
        ];

        const txArguments = {
          from: account || '',
          value: ethAmountInWei,
          ...(gasPrice ? {gasPrice} : null),
        };

        txReceipt = await txSend(
          'onboardEth',
          kycOnboardingContract.instance.methods,
          onboardEthArguments,
          txArguments
        );
      }

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

      setSubmitError(e);
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
      <RenderWrapper>
        <div className="form__description">
          <p>
            Tribute DAO will have up to {maxMembersText} initial members. Each
            member can purchase {minUnitsText} units for {minAmountText}{' '}
            {amountUnit} (up to {maxUnitsText} units for {maxAmountText}{' '}
            {amountUnit}).
          </p>
          <p>
            Please put your preferred ETH address below and the amount of{' '}
            {amountUnit} you&apos;d like to contribute.
          </p>
        </div>

        <div className="form__description--unauthorized">
          <p>
            {renderUnauthorizedMessage({
              defaultChainError,
              isConnected,
            })}
          </p>
        </div>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
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
          member can purchase {minUnitsText} units for {minAmountText}{' '}
          {amountUnit} (up to {maxUnitsText} units for {maxAmountText}{' '}
          {amountUnit}).
        </p>
        <p>
          Please put your preferred ETH address below and the amount of{' '}
          {amountUnit} you&apos;d like to contribute.
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
            {renderSubmitStatus({
              txEtherscanURL,
              txStatus,
              txEtherscanURLTokenApprove,
              txStatusTokenApprove,
            })}
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
          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
