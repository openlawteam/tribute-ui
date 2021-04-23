import {useState} from 'react';
import {SigUtilSigner} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {Link} from 'react-router-dom';
import {toChecksumAddress} from 'web3-utils';

import {
  getValidationError,
  stripFormatNumber,
  formatNumber,
} from '../../util/helpers';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
} from '../../components/web3/hooks';
import {Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {StoreState} from '../../store/types';
import {useWeb3Modal} from '../../components/web3/hooks';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';
import EtherscanURL from '../../components/web3/EtherscanURL';

enum Fields {
  applicantAddress = 'applicantAddress',
  issueAmount = 'issueAmount',
  privateKey = 'privateKey',
}

type FormInputs = {
  applicantAddress: string;
  issueAmount: string;
  privateKey: string;
};

type CouponType = 'coupon';

type RedeemCouponArguments = [
  string, // `dao`
  string, // `authorizedMember`
  string, // `amount`
  number, // `nonce`
  string // `signature`
];

export default function CouponOnboarding() {
  /**
   * Selectors
   */

  const CouponOnboardingContract = useSelector(
    (state: StoreState) => state.contracts?.CouponOnboardingContract
  );
  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );
  const isDAOCreator = useSelector(
    (s: StoreState) => s.connectedMember?.isDAOCreator
  );

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();
  const {connected, account} = useWeb3Modal();
  const gasPrices = useETHGasPrice();
  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Variables
   */

  const {errors, getValues, setValue, register, trigger} = form;

  const couponOnboardingError = submitError || txError;
  const isConnected = connected && account;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Functions
   */

  async function handleSubmit(values: FormInputs) {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please make sure your wallet is connected.'
        );
      }

      if (!CouponOnboardingContract) {
        throw new Error('No CouponOnboardingContract found.');
      }

      if (!DaoRegistryContract) {
        throw new Error('No DaoRegistryContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      const {applicantAddress, issueAmount, privateKey} = values;

      const applicantAddressToChecksum = toChecksumAddress(applicantAddress);
      const issueAmountArg = stripFormatNumber(issueAmount);
      const nonce = Date.now();

      const couponData = {
        type: 'coupon' as CouponType,
        authorizedMember: applicantAddressToChecksum,
        amount: issueAmountArg,
        nonce,
      };

      const signerUtil = SigUtilSigner(privateKey);
      const signature = signerUtil(
        couponData,
        DaoRegistryContract.contractAddress,
        CouponOnboardingContract.contractAddress,
        1
      );

      const redeemCouponArguments: RedeemCouponArguments = [
        DaoRegistryContract.contractAddress,
        applicantAddressToChecksum,
        issueAmountArg,
        nonce,
        signature,
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `redeemCoupon`
      await txSend(
        'redeemCoupon',
        CouponOnboardingContract.instance.methods,
        redeemCouponArguments,
        txArguments
      );
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // chain tx
    if (txStatus === Web3TxStatus.AWAITING_CONFIRM) {
      return 'Awaiting your confirmation\u2026';
    }

    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.PENDING:
        return (
          <>
            <div>{'Redeeming the onboarding coupon\u2026'}</div>

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>
              Onboarding coupon redeemed!
              <br />
              The DAO membership units have been issued.
            </div>

            <EtherscanURL url={txEtherscanURL} />

            <div style={{marginTop: '1rem'}}>
              View all the <Link to="/members">Members</Link>
              <br />
              <small>
                You can also reload the page to issue more membership units.
              </small>
            </div>
          </>
        );
      default:
        return null;
    }
  }

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to process an onboarding coupon.';
    }

    if (!isDAOCreator) {
      return 'You are not authorized to use this feature.';
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
  if (!isConnected || !isDAOCreator || defaultChainError) {
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

        {/* ISSUE AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label">Issue Amount</label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby={`error-${Fields.issueAmount}`}
              aria-invalid={errors.issueAmount ? 'true' : 'false'}
              name={Fields.issueAmount}
              onChange={() =>
                setValue(
                  Fields.issueAmount,
                  formatNumber(getValues().issueAmount)
                )
              }
              ref={register({
                validate: (issueAmount: string): string | boolean => {
                  const amount = Number(stripFormatNumber(issueAmount));

                  return issueAmount === ''
                    ? FormFieldErrors.REQUIRED
                    : isNaN(amount)
                    ? FormFieldErrors.INVALID_NUMBER
                    : amount < 0
                    ? 'The value must be at least 0.'
                    : true;
                },
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.issueAmount, errors)}
              id={`error-${Fields.issueAmount}`}
            />

            <div className="form__input-description">
              This is the amount of DAO membership units that will be issued to
              the Applicant Address.
            </div>
          </div>
        </div>

        {/* PRIVATE KEY */}
        <div className="form__input-row">
          <label className="form__input-row-label">Private Key</label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby={`error-${Fields.privateKey}`}
              aria-invalid={errors.privateKey ? 'true' : 'false'}
              name={Fields.privateKey}
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              type="text"
              disabled={isInProcessOrDone}
            />

            <InputError
              error={getValidationError(Fields.privateKey, errors)}
              id={`error-${Fields.privateKey}`}
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
        {couponOnboardingError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while onboarding the applicant."
              error={couponOnboardingError}
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
          <h2 className="titlebar__title">Coupon Onboarding</h2>
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
