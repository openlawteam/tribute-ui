import React, {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {Link} from 'react-router-dom';
import {Contract as Web3Contract} from 'web3-eth-contract/types';
import {toBN} from 'web3-utils';

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
} from '../../components/web3/hooks';
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {MetaMaskRPCError} from '../../util/types';
import {SHARES_ADDRESS} from '../../config';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {useHistory} from 'react-router-dom';
import {useSignAndSubmitProposal} from '../../components/proposals/hooks';
import {useWeb3Modal} from '../../components/web3/hooks';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';
import EtherscanURL from '../../components/web3/EtherscanURL';

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

type TributeArguments = [
  string, // `dao`
  string, // `proposalId`
  string, // `applicant`
  string, // `tokenToMint`
  string, // `requestAmount`
  string, // `tokenAddr`
  string // `tributeAmount`
];

type TokenApproveArguments = [
  string, // `spender`
  string // `value`
];

type ERC20Details = {
  symbol: string;
  decimals: number;
};

type BN = ReturnType<typeof toBN>;

export default function CreateTributeProposal() {
  /**
   * Selectors
   */

  const TributeContract = useSelector(
    (state: StoreState) => state.contracts?.TributeContract
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
    txError: txErrorTokenApprove,
    txEtherscanURL: txEtherscanURLTokenApprove,
    txIsPromptOpen: txIsPromptOpenTokenApprove,
    txSend: txSendTokenApprove,
    txStatus: txStatusTokenApprove,
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
  const [userERC20Balance, setUserERC20Balance] = useState<string>();
  const [erc20Details, setERC20Details] = useState<ERC20Details>();
  const [erc20Contract, setERC20Contract] = useState<Web3Contract>();

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
  const erc20AddressValue = getValues().erc20Address;

  const createTributeError = submitError || txError || txErrorTokenApprove;
  const isConnected = connected && account;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM ||
    txStatusTokenApprove === Web3TxStatus.PENDING ||
    proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
    proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone =
    txStatus === Web3TxStatus.FULFILLED &&
    proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone =
    isInProcess || isDone || txIsPromptOpen || txIsPromptOpenTokenApprove;

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

  /**
   * Functions
   */

  async function getERC20Contract() {
    if (!web3Instance || !erc20AddressValue) {
      setERC20Contract(undefined);
      return;
    }

    try {
      const lazyERC20ABI = await import('../../truffle-contracts/ERC20.json');
      const erc20Contract: Record<string, any> = lazyERC20ABI;
      const instance = new web3Instance.eth.Contract(
        erc20Contract.abi,
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

  async function handleSubmitTokenApprove(
    tributeAmountWithDecimals: BN,
    allowanceBN: BN
  ) {
    try {
      if (!erc20Contract) {
        throw new Error('No ERC20Contract found.');
      }

      if (!TributeContract) {
        throw new Error('No TributeContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      const difference = tributeAmountWithDecimals.sub(allowanceBN);
      const approveValue = allowanceBN.add(difference);
      const tokenApproveArguments: TokenApproveArguments = [
        TributeContract.contractAddress,
        approveValue.toString(),
      ];
      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `approve`
      await txSendTokenApprove(
        'approve',
        erc20Contract.methods,
        tokenApproveArguments,
        txArguments
      );
    } catch (error) {
      throw error;
    }
  }

  async function handleSubmit(values: FormInputs) {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!TributeContract) {
        throw new Error('No TributeContract found.');
      }

      if (!DaoRegistryContract) {
        throw new Error('No DaoRegistryContract found.');
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

      // Check if adapter is allowed to spend amount of tribute tokens on behalf
      // of user. If allowance is not sufficient, approve the adapter to spend
      // the amount of tokens needed for the user to provide the full tribute
      // amount.
      const allowance = await erc20Contract.methods
        .allowance(account, TributeContract.contractAddress)
        .call();
      const allowanceBN = toBN(allowance);

      if (tributeAmountWithDecimals.gt(allowanceBN)) {
        try {
          await handleSubmitTokenApprove(
            tributeAmountWithDecimals,
            allowanceBN
          );
        } catch (error) {
          console.error(error);
          throw new Error(
            'Your ERC20 tokens could not be approved for transfer.'
          );
        }
      }

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        // Sign and submit draft for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name: applicantAddress,
            body: description || `Tribute for ${applicantAddress}.`,
            metadata: {},
          },
          adapterName: ContractAdapterNames.tribute,
          type: SnapshotType.draft,
        });

        proposalId = uniqueId;
      }

      const tributeArguments: TributeArguments = [
        DaoRegistryContract.contractAddress,
        proposalId,
        applicantAddress,
        SHARES_ADDRESS,
        requestAmountArg,
        erc20Address,
        tributeAmountWithDecimals.toString(),
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `provideTribute`
      await txSend(
        'provideTribute',
        TributeContract.instance.methods,
        tributeArguments,
        txArguments
      );

      // go to TributeDetails page for newly created tribute proposal
      history.push(`/tributes/${proposalId}`);
    } catch (error) {
      // Set any errors from Web3 utils or explicitly set above.
      setSubmitError(error);
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // Either Snapshot or chain tx
    if (
      txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM ||
      proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM
    ) {
      return 'Awaiting your confirmation\u2026';
    }

    // If token approve transaction is confirmed
    if (txStatusTokenApprove === Web3TxStatus.PENDING) {
      return (
        <>
          <div>{'Approving your tokens for transfer\u2026'}</div>

          <EtherscanURL url={txEtherscanURLTokenApprove} isPending />
        </>
      );
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

  function renderUserERC20Balance() {
    if (!userERC20Balance) {
      return '---';
    }

    const isBalanceInt = !userERC20Balance.includes('.');
    return isBalanceInt
      ? userERC20Balance
      : formatDecimal(Number(userERC20Balance));
  }

  /**
   * Render
   */

  // Render wallet auth message if user is not connected
  if (!isConnected) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>Connect your wallet to submit a tribute proposal.</p>
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
              defaultValue={account}
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
                onChange={() =>
                  setValue(
                    Fields.tributeAmount,
                    formatNumber(getValues().tributeAmount)
                  )
                }
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
              proposal is accepted, the funds will automatically be sent to the
              DAO. If the proposal fails, the funds will be refunded to you.
            </div>
          </div>

          <div className="form__input-addon">
            available:{' '}
            <span className="text-underline">{renderUserERC20Balance()}</span>
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
              onChange={() =>
                setValue(
                  Fields.requestAmount,
                  formatNumber(getValues().requestAmount)
                )
              }
              ref={register({
                validate: (requestAmount: string): string | boolean => {
                  const amount = Number(stripFormatNumber(requestAmount));

                  return requestAmount === ''
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
              error={getValidationError(Fields.requestAmount, errors)}
              id={`error-${Fields.requestAmount}`}
            />

            <div className="form__input-description">
              This is the amount of DAO tokens you are requesting be sent to the
              Applicant Address in exchange for your tribute. Current member
              allocations can be viewed{' '}
              <Link to="/members" target="_blank" rel="noopener noreferrer">
                here
              </Link>
              .
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form__textarea-row">
          <label className="form__input-row-label">Description</label>
          <div className="form__input-row-fieldwrap">
            <textarea
              aria-describedby={`error-${Fields.description}`}
              aria-invalid={errors.description ? 'true' : 'false'}
              name={Fields.description}
              placeholder="Say something about your tribute..."
              ref={register}
            />

            <InputError
              error={getValidationError(Fields.description, errors)}
              id={`error-${Fields.description}`}
            />
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
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Submit'}
        </button>

        {/* SUBMIT STATUS */}
        <div className="form__submit-status-container">
          {isInProcessOrDone && renderSubmitStatus()}
        </div>

        {/* SUBMIT ERROR */}
        {createTributeError &&
          (createTributeError as MetaMaskRPCError).code !== 4001 && (
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
