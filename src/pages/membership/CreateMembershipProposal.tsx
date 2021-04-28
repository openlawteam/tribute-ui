import React, {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {toWei, toChecksumAddress} from 'web3-utils';

import {
  getValidationError,
  stripFormatNumber,
  formatNumber,
  formatDecimal,
  truncateEthAddress,
} from '../../util/helpers';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
} from '../../components/web3/hooks';
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {UNITS_ADDRESS} from '../../config';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {useHistory} from 'react-router-dom';
import {useSignAndSubmitProposal} from '../../components/proposals/hooks';
import {useWeb3Modal} from '../../components/web3/hooks';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import EtherscanURL from '../../components/web3/EtherscanURL';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
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
  string, // `dao`
  string, // `proposalId`
  string, // `applicant`
  string, // `tokenToMint`
  string // `tokenAmount`
];

export default function CreateMembershipProposal() {
  /**
   * Selectors
   */

  const OnboardingContract = useSelector(
    (state: StoreState) => state.contracts?.OnboardingContract
  );
  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );

  /**
   * Hooks
   */

  const {defaultChainError} = useIsDefaultChain();
  const {connected, account, web3Instance} = useWeb3Modal();
  const gasPrices = useETHGasPrice();
  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();

  const {
    proposalData,
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

  /**
   * Variables
   */

  const {errors, getValues, setValue, register, trigger} = form;

  const createMemberError = submitError || txError;
  const isConnected = connected && account;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
    proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone =
    txStatus === Web3TxStatus.FULFILLED &&
    proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Cached callbacks
   */

  const getUserAccountBalanceCached = useCallback(getUserAccountBalance, [
    account,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getUserAccountBalanceCached();
  }, [getUserAccountBalanceCached]);

  // Set the value of `ethAddress` if the `account` changes
  useEffect(() => {
    setValue(Fields.ethAddress, account);
  }, [account, setValue]);

  /**
   * Functions
   */

  async function getUserAccountBalance() {
    if (!web3Instance || !account) {
      setUserAccountBalance(undefined);
      return;
    }

    try {
      // Ether wallet balance
      const accountBalanceInWei = await web3Instance.eth.getBalance(account);
      setUserAccountBalance(
        web3Instance.utils.fromWei(accountBalanceInWei, 'ether')
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

      if (!OnboardingContract) {
        throw new Error('No OnboardingContract found.');
      }

      if (!DaoRegistryContract) {
        throw new Error('No DaoRegistryContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      const {ethAddress, ethAmount} = values;
      const ethAddressToChecksum = toChecksumAddress(ethAddress);
      const ethAmountInWei = toWei(stripFormatNumber(ethAmount), 'ether');

      // Values needed to display relevant proposal amounts in the proposal
      // details page are set in the snapshot draft metadata. (We can no longer
      // rely on getting this data from onchain because the proposal may not
      // exist there yet.)
      const proposalAmountValues = {
        tributeAmount: ethAmount,
        tributeAmountUnit: 'ETH',
      };

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        // Sign and submit draft for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name: ethAddressToChecksum,
            body: `Membership for ${truncateEthAddress(
              ethAddressToChecksum,
              7
            )}.`,
            metadata: {proposalAmountValues},
          },
          adapterName: ContractAdapterNames.onboarding,
          type: SnapshotType.draft,
        });

        proposalId = uniqueId;
      }

      const onboardArguments: OnboardArguments = [
        DaoRegistryContract.contractAddress,
        proposalId,
        ethAddressToChecksum,
        UNITS_ADDRESS,
        ethAmountInWei,
      ];

      const txArguments = {
        from: account || '',
        value: ethAmountInWei,
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `onboard`
      await txSend(
        'onboard',
        OnboardingContract.instance.methods,
        onboardArguments,
        txArguments
      );

      // go to MemberDetails page for newly created member proposal
      history.push(`/membership/${proposalId}`);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // Either Snapshot or chain tx
    if (
      txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM
    ) {
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
            <div>Proposal submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  function renderUserAccountBalance() {
    if (!userAccountBalance) {
      return '---';
    }

    const isBalanceInt = Number.isInteger(Number(userAccountBalance));
    return isBalanceInt
      ? userAccountBalance
      : formatDecimal(Number(userAccountBalance));
  }

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to submit a membership proposal.';
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

        {/* ETH AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label" htmlFor={Fields.ethAmount}>
            Amount
          </label>
          <div className="form__input-row-fieldwrap--narrow">
            <div className="input__suffix-wrap">
              <input
                className="input__suffix"
                aria-describedby={`error-${Fields.ethAmount}`}
                aria-invalid={errors.ethAmount ? 'true' : 'false'}
                id={Fields.ethAmount}
                name={Fields.ethAmount}
                onChange={() =>
                  setValue(
                    Fields.ethAmount,
                    formatNumber(getValues().ethAmount)
                  )
                }
                ref={register({
                  validate: (value: string): string | boolean => {
                    const amount = Number(stripFormatNumber(value));

                    return value === ''
                      ? FormFieldErrors.REQUIRED
                      : isNaN(amount)
                      ? FormFieldErrors.INVALID_NUMBER
                      : amount <= 0
                      ? 'The value must be greater than 0 ETH.'
                      : amount >= Number(userAccountBalance)
                      ? 'Insufficient funds.'
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
              />
              <div className="input__suffix-item">ETH</div>
            </div>

            <InputError
              error={getValidationError(Fields.ethAmount, errors)}
              id={`error-${Fields.ethAmount}`}
            />
          </div>
          <div className="form__input-addon">
            available: <span>{renderUserAccountBalance()}</span>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          aria-label={isInProcess ? 'Submitting your proposal.' : ''}
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
        {createMemberError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while submitting the proposal."
              error={createMemberError}
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
