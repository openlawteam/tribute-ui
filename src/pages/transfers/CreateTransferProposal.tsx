import React, {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {toBN, fromUtf8} from 'web3-utils';

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
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {MetaMaskRPCError} from '../../util/types';
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
  type = 'type',
  tokenAddress = 'tokenAddress',
  memberAddress = 'memberAddress',
  amount = 'amount',
  notes = 'notes',
}

type FormInputs = {
  type: string;
  tokenAddress: string;
  memberAddress: string;
  amount: string;
  notes: string;
};

type TransferArguments = [
  string, // `dao`
  string, // `proposalId`
  string, // `shareHolderAddr`
  string, // `token`
  string, // `amount`
  string // `data`
];

type TokenDetails = {
  name: string;
  symbol: string;
  address: string;
  daoBalance: string;
};

type BN = ReturnType<typeof toBN>;

export default function CreateTransferProposal() {
  /**
   * Selectors
   */

  const DistributeContract = useSelector(
    (state: StoreState) => state.contracts?.DistributeContract
  );
  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );
  const BankExtensionContract = useSelector(
    (state: StoreState) => state.contracts?.BankExtensionContract
  );

  /**
   * Hooks
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
  const [daoTokens, setDaoTokens] = useState<TokenDetails[]>();

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
    watch,
  } = form;
  const typeValue = watch('type');
  const isTypeSingleMember = typeValue === 'single member';

  const createTributeError = submitError || txError;
  const isConnected = connected && account;

  /**
   * @note From the docs: "Read the formState before render to subscribe the form state through Proxy"
   * @see https://react-hook-form.com/api#formState
   */
  const {isValid} = formState;

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

  const getDaoTokensCached = useCallback(getDaoTokens, [
    BankExtensionContract,
    account,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getDaoTokensCached();
  }, [getDaoTokensCached]);

  /**
   * Functions
   */

  async function getDaoTokens() {
    if (!account || !BankExtensionContract) {
      setDaoTokens(undefined);
      return;
    }

    const fetchedTokens = await BankExtensionContract.instance.methods
      .getTokens()
      .call();
    console.log({fetchedTokens});
  }

  async function handleSubmit(values: FormInputs) {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!DistributeContract) {
        throw new Error('No TributeContract found.');
      }

      if (!DaoRegistryContract) {
        throw new Error('No DaoRegistryContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      const {tokenAddress, memberAddress, amount, notes} = values;

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      const bodyIntro = isTypeSingleMember
        ? `Transfer to ${memberAddress}.`
        : 'Transfer to all members.';

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        const body = notes ? `${bodyIntro}\n${notes}` : bodyIntro;
        const name = isTypeSingleMember ? memberAddress : 'All members.';

        // Sign and submit draft for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name,
            body,
            metadata: {
              // @todo
            },
          },
          adapterName: ContractAdapterNames.distribute,
          type: SnapshotType.draft,
        });

        proposalId = uniqueId;
      }

      const memberAddressArg = isTypeSingleMember
        ? memberAddress
        : '0x0000000000000000000000000000000000000000'; //indicates distribution to all active members
      const transferArguments: TransferArguments = [
        DaoRegistryContract.contractAddress,
        proposalId,
        memberAddressArg,
        tokenAddress,
        amount,
        fromUtf8(bodyIntro),
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `submitProposal`
      await txSend(
        'submitProposal',
        DistributeContract.instance.methods,
        transferArguments,
        txArguments
      );

      // go to TransferDetails page for newly created transfer proposal
      history.push(`/transfers/${proposalId}`);
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

  /**
   * Render
   */

  // Render wallet auth message if user is not connected
  if (!isConnected) {
    return (
      <RenderWrapper>
        <div className="form__description--unauthorized">
          <p>Connect your wallet to submit a transfer proposal.</p>
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
        {/* TYPE */}
        <div className="form__input-row">
          <label className="form__input-row-label">Type</label>
          <div className="form__input-row-fieldwrap">
            <select
              name={Fields.type}
              ref={register}
              disabled={isInProcessOrDone}>
              <option value="single member">Single member</option>
              <option value="all members">All members</option>
            </select>
          </div>
        </div>

        {/* MEMBER ADDRESS */}
        {isTypeSingleMember && (
          <div className="form__input-row">
            <label className="form__input-row-label">Member Address</label>
            <div className="form__input-row-fieldwrap">
              <input
                aria-describedby={`error-${Fields.memberAddress}`}
                aria-invalid={errors.memberAddress ? 'true' : 'false'}
                name={Fields.memberAddress}
                ref={register({
                  validate: (memberAddress: string): string | boolean => {
                    return !memberAddress
                      ? FormFieldErrors.REQUIRED
                      : !isEthAddressValid(memberAddress)
                      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
              />

              <InputError
                error={getValidationError(Fields.memberAddress, errors)}
                id={`error-${Fields.memberAddress}`}
              />
            </div>
          </div>
        )}

        {/* TOKEN ADDRESS */}
        <div className="form__input-row">
          <label className="form__input-row-label">Asset</label>
          <div className="form__input-row-fieldwrap">
            <select
              aria-describedby={`error-${Fields.tokenAddress}`}
              aria-invalid={errors.tokenAddress ? 'true' : 'false'}
              name={Fields.tokenAddress}
              ref={register({
                required: FormFieldErrors.REQUIRED,
              })}
              disabled={isInProcessOrDone}>
              <option value="">Select from DAO assets</option>
              <option value="0x0000000000000000000000000000000000000000">
                ETH
              </option>
              <option value="0x8CF54B5422Cc49571D3b7BA67Fe1114436EE7280">
                OLT
              </option>
              <option value="0xc1d55803652F10E33d59bC6D853200Ce54C6BCCB">
                TT1
              </option>
              <option value="0x2bF80a7274e52583654596EdAfD08352Ab0f708C">
                TT2
              </option>
            </select>

            <InputError
              error={getValidationError(Fields.tokenAddress, errors)}
              id={`error-${Fields.tokenAddress}`}
            />
          </div>
        </div>

        {/* AMOUNT */}
        <div className="form__input-row">
          <label className="form__input-row-label">Amount</label>
          <div className="form__input-row-fieldwrap--narrow">
            <div className="input__suffix-wrap">
              <input
                className="input__suffix"
                aria-describedby={`error-${Fields.amount}`}
                aria-invalid={errors.amount ? 'true' : 'false'}
                name={Fields.amount}
                onChange={() =>
                  setValue(Fields.amount, formatNumber(getValues().amount))
                }
                ref={register({
                  validate: (amount: string): string | boolean => {
                    const amountToNumber = Number(stripFormatNumber(amount));

                    return amount === ''
                      ? FormFieldErrors.REQUIRED
                      : isNaN(amountToNumber)
                      ? FormFieldErrors.INVALID_NUMBER
                      : amountToNumber <= 0
                      ? 'The value must be greater than 0.'
                      : // @todo
                        // : amountToNumber > Number(userERC20Balance)
                        // ? 'Insufficient funds.'
                        true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
              />

              <div className="input__suffix-item">
                {/* {erc20Details?.symbol || '___'} */}
                {/* @todo */}
                ___
              </div>
            </div>

            <InputError
              error={getValidationError(Fields.amount, errors)}
              id={`error-${Fields.amount}`}
            />

            <div className="form__input-description">
              {isTypeSingleMember
                ? "If the proposal passes, this amount will be distributed to the member's internal account."
                : "If the proposal passes, this total amount will be distributed pro rata to all members' internal accounts, based on the current number of shares held by each member."}
            </div>
          </div>

          <div className="form__input-addon">
            available:{' '}
            <span className="text-underline">
              {/* {renderUserERC20Balance()} */}
              {/* @todo */}
              ---
            </span>
          </div>
        </div>

        {/* NOTES */}
        <div className="form__textarea-row">
          <label className="form__input-row-label">Notes</label>
          <div className="form__input-row-fieldwrap">
            <textarea
              name={Fields.notes}
              placeholder="Transactions purpose..."
              ref={register}
              disabled={isInProcessOrDone}
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
          <h2 className="titlebar__title">Transfer Proposal</h2>
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
