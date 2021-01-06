import React, {useState, useCallback, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useForm} from 'react-hook-form';
import {useHistory} from 'react-router-dom';
import Web3 from 'web3';

import {FormFieldErrors, Web3TxStatus} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {
  getValidationError,
  stripFormatNumber,
  formatNumber,
  contractSend,
  dontCloseWindowWarning,
  formatDecimal,
} from '../../util/helpers';
import {
  StoreState,
  MetaMaskRPCError,
  SmartContractItem,
} from '../../util/types';
import {ETHERSCAN_URLS, CHAINS} from '../../util/config';
import {useETHGasPrice, useIsDefaultChain} from '../../hooks';
import {useWeb3Modal} from '../../components/web3/Web3ModalManager';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';

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

export default function CreateMemberProposal() {
  /**
   * Selectors
   */

  const chainId = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );
  const OnboardingContract = useSelector(
    (state: StoreState) =>
      state.blockchain.contracts &&
      state.blockchain.contracts.OnboardingContract
  );
  const DaoRegistryContract = useSelector(
    (state: StoreState) =>
      state.blockchain.contracts &&
      state.blockchain.contracts.DaoRegistryContract
  );
  const web3Instance = useSelector(
    (state: StoreState) => state.blockchain.web3Instance
  );

  /**
   * Hooks
   */

  const {isDefaultChain, defaultChainError} = useIsDefaultChain();
  const {connected, account} = useWeb3Modal();
  const gasPrices = useETHGasPrice();

  /**
   * External hooks
   */

  const form = useForm<FormInputs>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const history = useHistory();

  /**
   * State
   */

  const [submitStatus, setSubmitStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );
  const [submitError, setSubmitError] = useState<Error>();
  const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);
  const [etherscanURL, setEtherscanURL] = useState<string>('');
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

  const isConnected = connected && account;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isInProcessOrDone =
    submitStatus === Web3TxStatus.AWAITING_CONFIRM ||
    submitStatus === Web3TxStatus.PENDING ||
    submitStatus === Web3TxStatus.FULFILLED ||
    isPromptOpen;

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
      console.error(error);

      setUserAccountBalance(undefined);
    }
  }

  // TODO: Need to hook this to smart contract and snapshot.
  function handleSubmit(values: FormInputs) {
    console.log('submitted');
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!isDefaultChain) {
        throw new Error(defaultChainError);
      }

      // smart contract call to submit proposal
      setSubmitStatus(Web3TxStatus.AWAITING_CONFIRM);
      // activate "don't close window" warning
      const unsubscribeDontCloseWindow = dontCloseWindowWarning();

      const handleProcessingTx = (txHash: string) => {
        if (!txHash) return;

        setIsPromptOpen(false);
        setSubmitStatus(Web3TxStatus.PENDING);
        if (chainId !== CHAINS.GANACHE) {
          setEtherscanURL(`${ETHERSCAN_URLS[chainId]}/tx/${txHash}`);
        }
      };

      try {
        if (!OnboardingContract) {
          throw new Error('No OnboardingContract');
        }

        if (!DaoRegistryContract) {
          throw new Error('No DaoRegistryContract');
        }

        setSubmitError(undefined);
        setEtherscanURL('');
        setIsPromptOpen(true);

        const {ethAddress, ethAmount} = values;
        const ethAmountInWei = Web3.utils.toWei(
          stripFormatNumber(ethAmount),
          'ether'
        );
        const onboardArguments: OnboardArguments = [
          (DaoRegistryContract as SmartContractItem).contractAddress,
          ethAddress,
          '0x0000000000000000000000000000000000000000', // ETH onboarding
          ethAmountInWei,
        ];
        const txArguments = {
          from: account,
          to: OnboardingContract.contractAddress,
          value: ethAmountInWei,
          // Set a fast gas price
          ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
        };

        /**
         * OnboardingContract
         *
         * Execute contract call for `onboard`
         */
        contractSend(
          'onboard',
          OnboardingContract.instance.methods,
          onboardArguments,
          txArguments,
          handleProcessingTx
        )
          .then(({txStatus, receipt, error}) => {
            if (txStatus === Web3TxStatus.FULFILLED) {
              if (!receipt) return;

              // Tx `receipt` resolved; tx went through.
              setSubmitStatus(Web3TxStatus.FULFILLED);

              // TODO: Figure out what's needed after transaction is successful
              // to go to newly created member proposal details page.

              // go to MemberDetails page for newly created member proposal
              // setTimeout(() => history.push(`/members/${proposalId}`), 2000);
            }

            if (txStatus === Web3TxStatus.REJECTED) {
              if (!error) return;
              setSubmitError(error);
              setSubmitStatus(Web3TxStatus.REJECTED);

              // If user closed modal (MetaMask error code 4001)
              // or via WalletConnect, which only provides a message and no code
              setIsPromptOpen(false);

              unsubscribeDontCloseWindow();
            }
          })
          .catch(({error}) => {
            setSubmitError(error);
            setSubmitStatus(Web3TxStatus.REJECTED);

            // If user closed modal (MetaMask error code 4001)
            // or via WalletConnect, which only provides a message and no code
            setIsPromptOpen(false);

            unsubscribeDontCloseWindow();
          });

        unsubscribeDontCloseWindow();
      } catch (error) {
        setIsPromptOpen(false);
        setSubmitError(error);
        setSubmitStatus(Web3TxStatus.REJECTED);

        unsubscribeDontCloseWindow();
      }
    } catch (error) {
      setSubmitError(error);
      setSubmitStatus(Web3TxStatus.REJECTED);
    }
  }

  function renderSubmitStatus() {
    switch (submitStatus) {
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
            {chainId !== CHAINS.GANACHE && (
              <small>
                <a
                  href={etherscanURL}
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
            {chainId !== CHAINS.GANACHE && (
              <small>
                <a
                  href={etherscanURL}
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
  if (!isDefaultChain) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>{defaultChainError}</p>
        </div>
      </RenderWrapper>
    );
  }

  // TODO: Consider adding check to see if user ethereum address is either
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
          {submitStatus === Web3TxStatus.PENDING ||
          submitStatus === Web3TxStatus.AWAITING_CONFIRM ? (
            <Loader />
          ) : submitStatus === Web3TxStatus.FULFILLED ? (
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
        {submitError && (submitError as MetaMaskRPCError).code !== 4001 && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while submitting the proposal."
              error={submitError}
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
