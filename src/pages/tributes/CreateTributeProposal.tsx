import {useState, useCallback, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useHistory} from 'react-router-dom';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {toBN, AbiItem, toChecksumAddress} from 'web3-utils';
import {debounce} from 'debounce';

import {
  formatNumber,
  getValidationError,
  normalizeString,
  stripFormatNumber,
  truncateEthAddress,
} from '../../util/helpers';
import {useIsDefaultChain, useWeb3Modal} from '../../components/web3/hooks';
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {AsyncStatus} from '../../util/types';
import {UNITS_ADDRESS} from '../../config';
import {StoreState} from '../../store/types';
import {
  useCheckApplicant,
  useSignAndSubmitProposal,
} from '../../components/proposals/hooks';
import {CycleEllipsis} from '../../components/feedback';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';

enum Fields {
  applicantAddress = 'applicantAddress',
  erc20Address = 'erc20Address',
  tributeAmount = 'tributeAmount',
  requestAmount = 'requestAmount',
  description = 'description',
}

type FormInputs = {
  applicantAddress: string;
  erc20Address: string;
  tributeAmount: string;
  requestAmount: string;
  description: string;
};

type SubmitActionArguments = [
  string, // `applicant`
  string, // `tokenToMint`
  string, // `requestAmount`
  string, // `tokenAddr`
  string, // `tributeAmount`
  string // `tributeTokenOwner`
];

type ERC20Details = {
  symbol: string;
  decimals: number;
};

export default function CreateTributeProposal() {
  /**
   * Selectors
   */

  const ERC20ExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.ERC20ExtensionContract
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
  const [userERC20Balance, setUserERC20Balance] = useState<string>();
  const [erc20Details, setERC20Details] = useState<ERC20Details>();
  const [erc20Contract, setERC20Contract] = useState<Web3Contract>();

  /**
   * Variables
   */

  const {errors, getValues, setValue, register, trigger, watch} = form;

  const erc20AddressValue = watch(Fields.erc20Address);

  const applicantAddressValue = watch(Fields.applicantAddress);

  const createTributeError = submitError || proposalSignAndSendError;

  const isConnected = connected && account;

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
  } = useCheckApplicant(applicantAddressValue);

  /**
   * Cached callbacks
   */

  const getERC20ContractCached = useCallback(getERC20Contract, [
    erc20AddressValue,
    web3Instance,
  ]);

  const getERC20DetailsCached = useCallback(getERC20Details, [
    account,
    erc20Contract,
  ]);

  const getUserERC20BalanceCached = useCallback(getUserERC20Balance, [
    account,
    erc20Contract,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getERC20ContractCached();
  }, [getERC20ContractCached]);

  useEffect(() => {
    getERC20DetailsCached();
  }, [getERC20DetailsCached]);

  useEffect(() => {
    getUserERC20BalanceCached();
  }, [getUserERC20BalanceCached]);

  // Set the value of `applicantAddress` if the `account` changes
  useEffect(() => {
    setValue(Fields.applicantAddress, account);
  }, [account, setValue]);

  /**
   * Functions
   */

  async function getERC20Contract() {
    if (!web3Instance || !erc20AddressValue) {
      setERC20Contract(undefined);
      return;
    }

    try {
      const {default: lazyERC20ABI} = await import(
        '../../abis/external/ERC20.json'
      );
      const erc20Contract: AbiItem[] = lazyERC20ABI as any;
      const instance = new web3Instance.eth.Contract(
        erc20Contract,
        erc20AddressValue
      );
      setERC20Contract(instance);
    } catch (error) {
      console.error(error);
      setERC20Contract(undefined);
    }
  }

  async function getERC20Details() {
    if (!account || !erc20Contract) {
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

  async function getUserERC20Balance() {
    if (!account || !erc20Contract) {
      setUserERC20Balance(undefined);
      return;
    }

    try {
      const balance = await erc20Contract.methods.balanceOf(account).call();
      const balanceBN = toBN(balance);
      const decimals = await erc20Contract.methods.decimals().call();
      const divisor = toBN(10).pow(toBN(decimals));
      const beforeDecimal = balanceBN.div(divisor);
      const afterDecimal = balanceBN.mod(divisor);
      const balanceReadable = afterDecimal.eq(toBN(0))
        ? beforeDecimal.toString()
        : `${beforeDecimal.toString()}.${afterDecimal.toString()}`;

      setUserERC20Balance(balanceReadable);
    } catch (error) {
      console.error(error);
      setUserERC20Balance(undefined);
    }
  }

  async function getRequestAmountUnit() {
    if (!ERC20ExtensionContract) {
      return 'UNITS';
    } else {
      try {
        return await ERC20ExtensionContract.instance.methods.symbol().call();
      } catch (error) {
        console.log(error);
        return 'UNITS';
      }
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

      if (!erc20Contract) {
        throw new Error('No ERC20Contract found.');
      }

      if (!erc20Details) {
        throw new Error('No ERC20 details found.');
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

      const {
        applicantAddress,
        erc20Address,
        tributeAmount,
        requestAmount,
        description,
      } = values;
      const multiplier = toBN(10).pow(toBN(erc20Details.decimals));
      const tributeAmountWithDecimals = toBN(
        stripFormatNumber(tributeAmount)
      ).mul(multiplier);
      const requestAmountArg = stripFormatNumber(requestAmount);
      const applicantAddressToChecksum = toChecksumAddress(applicantAddress);
      const proposerAddressToChecksum = toChecksumAddress(account);

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        const bodyIntro =
          normalizeString(applicantAddress) === normalizeString(account)
            ? `Tribute from ${truncateEthAddress(
                applicantAddressToChecksum,
                7
              )}.`
            : `Tribute from ${truncateEthAddress(
                proposerAddressToChecksum,
                7
              )} for applicant ${truncateEthAddress(
                applicantAddressToChecksum,
                7
              )}.`;
        const body = description ? `${bodyIntro}\n${description}` : bodyIntro;

        // Values needed to display relevant proposal amounts in the proposal
        // details page are set in the snapshot draft metadata. (We can no
        // longer rely on getting this data from onchain because the proposal
        // may not exist there yet.)
        const proposalAmountValues = {
          requestAmount,
          requestAmountUnit: await getRequestAmountUnit(),
          tributeAmount,
          tributeAmountUnit: erc20Details.symbol,
        };

        // Arguments needed to submit the proposal onchain are set in the
        // snapshot draft metadata.
        const submitActionArgs: SubmitActionArguments = [
          applicantAddressToChecksum,
          UNITS_ADDRESS,
          requestAmountArg,
          toChecksumAddress(erc20Address),
          tributeAmountWithDecimals.toString(),
          proposerAddressToChecksum,
        ];

        // Sign and submit draft for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name: applicantAddressToChecksum,
            body,
            metadata: {
              proposalAmountValues,
              submitActionArgs,
              accountAuthorizedToProcessPassedProposal:
                proposerAddressToChecksum,
            },
          },
          adapterName: ContractAdapterNames.tribute,
          type: SnapshotType.draft,
        });

        proposalId = uniqueId;
      }

      // go to TributeDetails page for newly created tribute proposal
      history.push(`/tributes/${proposalId}`);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      const e = error as Error;

      setSubmitError(e);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
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
        return '';
    }
  }

  function renderUserERC20Balance() {
    if (!userERC20Balance) {
      return '---';
    }

    return formatNumber(userERC20Balance);
  }

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to submit a tribute proposal.';
    }

    // user is on wrong network
    if (defaultChainError) {
      return defaultChainError.message;
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
          <p>{getUnauthorizedMessage()}</p>
        </div>
      </RenderWrapper>
    );
  }

  return (
    <RenderWrapper>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        {/* APPLICANT ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label">Applicant Address</label>
          <div className="form__input-row-fieldwrap">
            {/* @note We don't need the default value as it's handled in the useEffect above. */}
            <input
              aria-describedby={`error-${Fields.applicantAddress}`}
              aria-invalid={errors.applicantAddress ? 'true' : 'false'}
              name={Fields.applicantAddress}
              ref={register({
                validate: (applicantAddress: string): string | boolean => {
                  return !applicantAddress
                    ? FormFieldErrors.REQUIRED
                    : !isEthAddressValid(applicantAddress)
                    ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                    : true;
                },
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.applicantAddress, errors)}
              id={`error-${Fields.applicantAddress}`}
            />
          </div>
        </div>

        {/* ERC20 ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label">ERC20 Address</label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby={`error-${Fields.erc20Address}`}
              aria-invalid={errors.erc20Address ? 'true' : 'false'}
              name={Fields.erc20Address}
              ref={register({
                validate: (erc20Address: string): string | boolean => {
                  return !erc20Address
                    ? FormFieldErrors.REQUIRED
                    : !isEthAddressValid(erc20Address)
                    ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                    : true;
                },
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.erc20Address, errors)}
              id={`error-${Fields.erc20Address}`}
            />
          </div>
        </div>

        {/* TRIBUTE AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label">Amount</label>
          <div className="form__input-row-fieldwrap--narrow">
            <div className="input__suffix-wrap">
              <input
                className="input__suffix"
                aria-describedby={`error-${Fields.tributeAmount}`}
                aria-invalid={errors.tributeAmount ? 'true' : 'false'}
                name={Fields.tributeAmount}
                onChange={debounce(
                  () =>
                    setValue(
                      Fields.tributeAmount,
                      formatNumber(stripFormatNumber(getValues().tributeAmount))
                    ),
                  1000
                )}
                ref={register({
                  validate: (tributeAmount: string): string | boolean => {
                    const amount = Number(stripFormatNumber(tributeAmount));

                    return tributeAmount === ''
                      ? FormFieldErrors.REQUIRED
                      : isNaN(amount)
                      ? FormFieldErrors.INVALID_NUMBER
                      : amount <= 0
                      ? 'The value must be greater than 0.'
                      : amount > Number(userERC20Balance)
                      ? 'Insufficient funds.'
                      : !Number.isInteger(amount)
                      ? 'The value must be an integer for an ERC20 token.'
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
              />

              <div className="input__suffix-item">
                {erc20Details?.symbol || '___'}
              </div>
            </div>

            <InputError
              error={getValidationError(Fields.tributeAmount, errors)}
              id={`error-${Fields.tributeAmount}`}
            />

            <div className="form__input-description">
              This amount will be held in escrow pending a member vote. If the
              proposal passes, the funds will automatically be sent to the DAO.
              If the proposal fails, the funds will be refunded to you.
            </div>
          </div>

          <div className="form__input-addon">
            available: <span>{renderUserERC20Balance()}</span>
          </div>
        </div>

        {/* REQUEST AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label">Request Amount</label>
          <div className="form__input-row-fieldwrap--narrow">
            <input
              aria-describedby={`error-${Fields.requestAmount}`}
              aria-invalid={errors.requestAmount ? 'true' : 'false'}
              name={Fields.requestAmount}
              onChange={debounce(
                () =>
                  setValue(
                    Fields.requestAmount,
                    formatNumber(stripFormatNumber(getValues().requestAmount))
                  ),
                1000
              )}
              ref={register({
                validate: (requestAmount: string): string | boolean => {
                  const amount = Number(stripFormatNumber(requestAmount));

                  return requestAmount === ''
                    ? FormFieldErrors.REQUIRED
                    : isNaN(amount)
                    ? FormFieldErrors.INVALID_NUMBER
                    : amount < 0
                    ? 'The value must be at least 0.'
                    : !Number.isInteger(amount)
                    ? 'The value must be an integer.'
                    : true;
                },
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.requestAmount, errors)}
              id={`error-${Fields.requestAmount}`}
            />

            <div className="form__input-description">
              This is the amount of DAO membership tokens you are requesting be
              sent to the Applicant Address in exchange for your tribute.
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form__textarea-row">
          <label className="form__input-row-label">Description</label>
          <div className="form__input-row-fieldwrap">
            <textarea
              name={Fields.description}
              placeholder="Say something about your tribute..."
              ref={register}
              disabled={isInProcessOrDone}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button
          className="button"
          disabled={isInProcessOrDone}
          onClick={async () => {
            if (isInProcessOrDone) return;

            if (!(await trigger())) {
              return;
            }

            handleSubmit(getValues());
          }}
          type="submit">
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
        </button>

        {/* SUBMIT STATUS */}
        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {renderSubmitStatus()}
          </div>
        )}

        {/* SUBMIT ERROR */}
        {createTributeError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while submitting the proposal."
              error={createTributeError}
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
          <h2 className="titlebar__title">Tribute Proposal</h2>
        </div>

        <div className="form-wrapper">
          <div className="form__description">
            <p>
              A tribute proposal is a proposal to send a certain amount of DAO
              membership tokens to an applicant address. The proposal will be
              held in escrow until a member votes on it. If the proposal passes,
              the funds will automatically be sent to the DAO. If the proposal
              fails, the funds will be refunded to you.
            </p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
