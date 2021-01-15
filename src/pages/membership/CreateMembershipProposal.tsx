import React, {useState, useCallback, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useForm} from 'react-hook-form';
// import {useHistory} from 'react-router-dom';
import Web3 from 'web3';

import {
  getValidationError,
  stripFormatNumber,
  formatNumber,
  formatDecimal,
} from '../../util/helpers';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  usePrepareAndSignProposalData,
} from '../../components/web3/hooks';
import {CHAINS} from '../../config';
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {SHARES_ADDRESS} from '../../config';
import {StoreState, MetaMaskRPCError} from '../../util/types';
import {useWeb3Modal} from '../../components/web3/hooks';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {getDefaultProposalBody} from '../../components/web3/helpers';

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
  string, // `applicant`
  string, // `tokenToMint`
  string // `tokenAmount`
];

type UserAccountBalance = {
  wei: string;
  eth: string;
};

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
  const {connected, account, networkId, web3Instance} = useWeb3Modal();
  const gasPrices = useETHGasPrice();
  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    // txReceipt,
    txSend,
    txStatus,
  } = useContractSend();

  const {prepareAndSignProposalData} = usePrepareAndSignProposalData();

  /**
   * Their hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  // const history = useHistory();

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();
  const [
    userAccountBalance,
    setUserAccountBalance,
  ] = useState<UserAccountBalance>();

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

  const createMemberError = submitError || txError;
  const isConnected = connected && account;
  const isChainGanache = networkId === CHAINS.GANACHE;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isInProcessOrDone =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    txStatus === Web3TxStatus.FULFILLED ||
    txIsPromptOpen;

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
      setUserAccountBalance({
        wei: accountBalanceInWei,
        eth: web3Instance.utils.fromWei(accountBalanceInWei),
      });
    } catch (error) {
      setUserAccountBalance(undefined);
    }
  }

  // @todo Need to hook this to smart contract and snapshot.
  async function handleSubmit(values: FormInputs) {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
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

      await prepareAndSignProposalData(
        {
          name: account,
          body: getDefaultProposalBody(
            account,
            ContractAdapterNames.onboarding
          ),
          metadata: {},
        },
        ContractAdapterNames.onboarding,
        SnapshotType.proposal
      );

      const {ethAddress, ethAmount} = values;
      const ethAmountInWei = Web3.utils.toWei(
        stripFormatNumber(ethAmount),
        'ether'
      );

      const onboardArguments: OnboardArguments = [
        DaoRegistryContract.contractAddress,
        ethAddress,
        // @note Eventually remove and get from shared tribute/laoland lib's
        SHARES_ADDRESS,
        ethAmountInWei,
      ];

      const txArguments = {
        from: account || '',
        value: ethAmountInWei,
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `onboard`
      /* const receipt =  */ await txSend(
        'onboard',
        OnboardingContract.instance.methods,
        onboardArguments,
        txArguments,
        // We don't need to do anything in this scope.
        () => {}
      );

      // @todo Figure out what's needed after transaction is successful
      // to go to newly created member proposal details page.

      // go to MemberDetails page for newly created member proposal
      // history.push(`/membership/${proposalHash}`);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
    }
  }

  function renderSubmitStatus() {
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return 'Awaiting your confirmation\u2026';
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={[
                'Submitting\u2026',
                'Working\u2026',
                'DAOing\u2026',
                'Getting closer\u2026',
                'Dreaming of ETH\u2026',
              ]}
              useFirstItemStart
              render={(message) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />
            {!isChainGanache && (
              <small>
                <a
                  href={txEtherscanURL}
                  rel="noopener noreferrer"
                  target="_blank">
                  view progress
                </a>
              </small>
            )}
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>Proposal submitted!</div>
            {!isChainGanache && (
              <small>
                <a
                  href={txEtherscanURL}
                  rel="noopener noreferrer"
                  target="_blank">
                  view transaction
                </a>
              </small>
            )}
          </>
        );
      default:
        return;
    }
  }

  /**
   * Render
   */

  // Render wallet auth message if user is not connected
  if (!isConnected) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>Connect your wallet to submit a member proposal.</p>
        </div>
      </RenderWrapper>
    );
  }

  // Render wrong network message if user is on wrong network
  if (defaultChainError) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>{defaultChainError.message}</p>
        </div>
      </RenderWrapper>
    );
  }

  // @todo Consider adding check to see if user ethereum address is either
  // already a member or has a pending member proposal.

  return (
    <RenderWrapper>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        {/* ETH ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label">ETH address</label>
          <div className="form__input-row-fieldwrap">
            <input
              aria-describedby="error-ethAddress"
              aria-invalid={errors.ethAddress ? 'true' : 'false'}
              name={Fields.ethAddress}
              defaultValue={account}
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
              id="error-ethAddress"
            />
          </div>
        </div>

        {/* ETH AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label">Amount</label>
          <div className="form__input-row-fieldwrap--narrow">
            <div className="input__suffix-wrap">
              <input
                className="input__suffix"
                aria-describedby="error-ethAmount"
                aria-invalid={errors.ethAmount ? 'true' : 'false'}
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
                      : amount >= Number(userAccountBalance?.eth)
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
              id="error-ethAmount"
            />
          </div>
          <div className="form__input-description">
            available:{' '}
            <span className="text-underline">
              {userAccountBalance
                ? formatDecimal(Number(userAccountBalance.eth))
                : '---'}{' '}
              ETH
            </span>
          </div>
        </div>

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
          {txStatus === Web3TxStatus.PENDING ||
          txStatus === Web3TxStatus.AWAITING_CONFIRM ? (
            <Loader />
          ) : txStatus === Web3TxStatus.FULFILLED ? (
            'Done'
          ) : (
            'Submit'
          )}
        </button>

        {/* SUBMIT STATUS */}
        <div className="form__submit-status-container">
          {isInProcessOrDone && renderSubmitStatus()}
        </div>

        {/* SUBMIT ERROR */}
        {createMemberError &&
          (createMemberError as MetaMaskRPCError).code !== 4001 && (
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
