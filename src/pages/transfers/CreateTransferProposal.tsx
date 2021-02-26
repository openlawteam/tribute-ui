import React, {useState, useCallback, useEffect} from 'react';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {useForm} from 'react-hook-form';
import {useSelector} from 'react-redux';
import {useHistory} from 'react-router-dom';
import {toBN, AbiItem, fromUtf8, toWei} from 'web3-utils';

import {ETH_TOKEN_ADDRESS, GUILD_ADDRESS, SHARES_ADDRESS} from '../../config';
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
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {useSignAndSubmitProposal} from '../../components/proposals/hooks';
import {useWeb3Modal} from '../../components/web3/hooks';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';
import EtherscanURL from '../../components/web3/EtherscanURL';
import {default as ERC20ABI} from '../../truffle-contracts/ERC20.json';

enum Fields {
  type = 'type',
  selectedToken = 'selectedToken',
  memberAddress = 'memberAddress',
  amount = 'amount',
  notes = 'notes',
}

type FormInputs = {
  type: string;
  selectedToken: string;
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
  decimals: number;
  daoBalance: string;
};

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
  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
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
  } = useSignAndSubmitProposal<SnapshotType.proposal>();

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
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<string>();

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
  const selectedTokenValue = watch('selectedToken');

  const createTransferError = submitError || txError;
  const isConnected = connected && account;
  const erc20Contract: AbiItem[] = ERC20ABI as any;

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
    erc20Contract,
    web3Instance,
  ]);

  const getSelectedTokenBalanceCached = useCallback(getSelectedTokenBalance, [
    account,
    selectedTokenValue,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    getDaoTokensCached();
  }, [getDaoTokensCached]);

  useEffect(() => {
    getSelectedTokenBalanceCached();
  }, [getSelectedTokenBalanceCached]);

  /**
   * Functions
   */

  async function getDaoTokens() {
    if (!account || !BankExtensionContract) {
      setDaoTokens(undefined);
      return;
    }

    try {
      const bankMethods = BankExtensionContract.instance.methods;
      // @todo replace this with multicall
      const fetchedTokens = await bankMethods.getTokens().call();
      const parsedTokens: TokenDetails[] = await Promise.all(
        fetchedTokens.map(async (token: string) => {
          try {
            const daoBalance = await bankMethods
              .balanceOf(GUILD_ADDRESS, token)
              .call();

            // Don't need to fetch token info if the balance is 0.
            if (toBN(daoBalance).lte(toBN(0))) return;

            if (token === ETH_TOKEN_ADDRESS) {
              return {
                name: 'Ether',
                symbol: 'ETH',
                address: ETH_TOKEN_ADDRESS,
                decimals: 18,
                daoBalance,
              };
            } else {
              if (!web3Instance) return;

              const erc20Instance = new web3Instance.eth.Contract(
                erc20Contract,
                token
              );

              const name = await erc20Instance.methods.name().call();
              const symbol = await erc20Instance.methods.symbol().call();
              const decimals = await erc20Instance.methods.decimals().call();

              return {
                name,
                symbol,
                address: token,
                decimals,
                daoBalance,
              };
            }
          } catch (error) {
            console.error(error);
          }
        })
      );

      let sortedTokens = parsedTokens
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      // If token list includes Ether, move it to the front.
      sortedTokens.some(
        (token, idx) =>
          token.address === ETH_TOKEN_ADDRESS &&
          sortedTokens.unshift(sortedTokens.splice(idx, 1)[0])
      );

      setDaoTokens(sortedTokens);
    } catch (error) {
      console.error(error);
      setDaoTokens(undefined);
    }
  }

  async function getSelectedTokenBalance() {
    if (!account || !selectedTokenValue) {
      setSelectedTokenBalance(undefined);
      return;
    }

    try {
      const selectedTokenObj = JSON.parse(selectedTokenValue);
      const balance = selectedTokenObj.daoBalance;
      const balanceBN = toBN(balance);
      const decimals = selectedTokenObj.decimals;
      const divisor = toBN(10).pow(toBN(decimals));
      const beforeDecimal = balanceBN.div(divisor);
      const afterDecimal = balanceBN.mod(divisor);
      const balanceReadable = afterDecimal.eq(toBN(0))
        ? beforeDecimal.toString()
        : `${beforeDecimal.toString()}.${afterDecimal.toString()}`;

      setSelectedTokenBalance(balanceReadable);
    } catch (error) {
      console.error(error);
      setSelectedTokenBalance(undefined);
    }
  }

  async function handleSubmit(values: FormInputs) {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please makes sure your wallet is connected.'
        );
      }

      if (!DistributeContract) {
        throw new Error('No DistributeContract found.');
      }

      if (!DaoRegistryContract) {
        throw new Error('No DaoRegistryContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      const {selectedToken, memberAddress, amount, notes} = values;
      const selectedTokenObj = JSON.parse(selectedToken);
      const {symbol, decimals, address} = selectedTokenObj;
      let amountArg;
      if (address === ETH_TOKEN_ADDRESS) {
        amountArg = toWei(stripFormatNumber(amount), 'ether');
      } else {
        const multiplier = toBN(10).pow(toBN(decimals));
        const amountWithDecimals = toBN(stripFormatNumber(amount)).mul(
          multiplier
        );
        amountArg = amountWithDecimals.toString();
      }

      // Maybe set proposal ID from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';

      const bodyIntro = isTypeSingleMember
        ? `Transfer to ${memberAddress}.`
        : 'Transfer to all members pro rata.';

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        const body = notes ? `${bodyIntro}\n${notes}` : bodyIntro;
        const name = isTypeSingleMember ? memberAddress : 'All members.';

        // Sign and submit proposal for snapshot-hub
        const {uniqueId} = await signAndSendProposal({
          partialProposalData: {
            name,
            body,
            metadata: {
              amountUnit: symbol,
              tokenDecimals: decimals,
            },
          },
          adapterName: ContractAdapterNames.distribute,
          type: SnapshotType.proposal,
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
        address,
        amountArg,
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

  function renderSelectedTokenBalance() {
    if (!selectedTokenBalance) {
      return '---';
    }

    const isBalanceInt = Number.isInteger(Number(selectedTokenBalance));
    return isBalanceInt
      ? selectedTokenBalance
      : formatDecimal(Number(selectedTokenBalance));
  }

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to submit a transfer proposal.';
    }

    // user is on wrong network
    if (defaultChainError) {
      return defaultChainError.message;
    }

    // user is not an active member
    if (!isActiveMember) {
      return 'Either you are not a member, or your membership is not active.';
    }
  }

  async function isActiveMemberWithShares(address: string) {
    if (!BankExtensionContract) {
      console.error('No BankExtensionContract found.');
      return false;
    }

    const sharesBalance = await BankExtensionContract.instance.methods
      .balanceOf(address, SHARES_ADDRESS)
      .call();

    return toBN(sharesBalance).gt(toBN(0));
  }

  /**
   * Render
   */

  // Render unauthorized message

  if (!isConnected || defaultChainError || !isActiveMember) {
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
                  validate: async (
                    memberAddress: string
                  ): Promise<string | boolean> => {
                    return !memberAddress
                      ? FormFieldErrors.REQUIRED
                      : !isEthAddressValid(memberAddress)
                      ? FormFieldErrors.INVALID_ETHEREUM_ADDRESS
                      : !(await isActiveMemberWithShares(memberAddress))
                      ? 'The address is not an active member with SHARES.'
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

        {/* SELECTED TOKEN */}
        <div className="form__input-row">
          <label className="form__input-row-label">Asset</label>
          <div className="form__input-row-fieldwrap">
            <select
              aria-describedby={`error-${Fields.selectedToken}`}
              aria-invalid={errors.selectedToken ? 'true' : 'false'}
              name={Fields.selectedToken}
              ref={register({
                validate: (token: string): string | boolean => {
                  return !daoTokens || daoTokens.length < 1
                    ? 'No tokens available for distribution.'
                    : !token
                    ? FormFieldErrors.REQUIRED
                    : true;
                },
              })}
              disabled={isInProcessOrDone}>
              <option value="">Select from DAO assets</option>
              {daoTokens?.map((token) => (
                <option
                  key={token.address}
                  value={JSON.stringify(
                    token
                  )}>{`${token.name} (${token.symbol})`}</option>
              ))}
            </select>

            <InputError
              error={getValidationError(Fields.selectedToken, errors)}
              id={`error-${Fields.selectedToken}`}
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
                    const selectedTokenObj =
                      selectedTokenValue && JSON.parse(selectedTokenValue);
                    const isSelectedTokenEth =
                      selectedTokenObj?.address === ETH_TOKEN_ADDRESS;

                    return amount === ''
                      ? FormFieldErrors.REQUIRED
                      : isNaN(amountToNumber)
                      ? FormFieldErrors.INVALID_NUMBER
                      : amountToNumber <= 0
                      ? 'The value must be greater than 0.'
                      : amountToNumber > Number(selectedTokenBalance)
                      ? 'Insufficient funds.'
                      : isSelectedTokenEth
                      ? true
                      : !Number.isInteger(amountToNumber)
                      ? 'The value must be an integer for an ERC20 token.'
                      : true;
                  },
                })}
                type="text"
                disabled={isInProcessOrDone}
              />

              <div className="input__suffix-item">
                {(selectedTokenValue &&
                  JSON.parse(selectedTokenValue).symbol) ||
                  '___'}
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
              {renderSelectedTokenBalance()}
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
        {createTransferError &&
          (createTransferError as MetaMaskRPCError).code !== 4001 && (
            <div className="form__submit-error-container">
              <ErrorMessageWithDetails
                renderText="Something went wrong while submitting the proposal."
                error={createTransferError}
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
