import {
  SnapshotType,
  SnapshotProposalData,
  prepareVoteProposalData,
} from '@openlaw/snapshot-js-erc712';
import {toBN, AbiItem, toWei, toChecksumAddress} from 'web3-utils';
import {useForm} from 'react-hook-form';
import {useHistory} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {useState, useCallback, useEffect} from 'react';
import {debounce} from 'debounce';

import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../../components/web3/hooks';
import {
  formatNumber,
  getValidationError,
  stripFormatNumber,
  truncateEthAddress,
} from '../../util/helpers';
import {BURN_ADDRESS} from '../../util/constants';
import {ContractAdapterNames, Web3TxStatus} from '../../components/web3/types';
import {default as ERC20ABI} from '../../abis/external/ERC20.json';
import {ETH_TOKEN_ADDRESS, GUILD_ADDRESS, UNITS_ADDRESS} from '../../config';
import {FormFieldErrors} from '../../util/enums';
import {isEthAddressValid} from '../../util/validation';
import {multicall, MulticallTuple} from '../../components/web3/helpers';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../../components/web3/config';
import {useSignAndSubmitProposal} from '../../components/proposals/hooks';
import CycleMessage from '../../components/feedback/CycleMessage';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import EtherscanURL from '../../components/web3/EtherscanURL';
import FadeIn from '../../components/common/FadeIn';
import InputError from '../../components/common/InputError';
import Loader from '../../components/feedback/Loader';
import Wrap from '../../components/common/Wrap';

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
  string, // `unitHolderAddr`
  string, // `token`
  string, // `amount`
  string // `data`
];

type InitialTokenDetails = {
  address: string;
  daoBalance: string;
};

type TokenDetails = InitialTokenDetails & {
  name: string;
  symbol: string;
  decimals: number;
};

const getDelegatedAddressMessage = (a: string) =>
  `Your member address is delegated to ${truncateEthAddress(
    a,
    7
  )}. You must use that address.`;

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
  const delegateAddress = useSelector(
    (s: StoreState) => s.connectedMember?.delegateKey
  );
  const isAddressDelegated = useSelector(
    (s: StoreState) => s.connectedMember?.isAddressDelegated
  );
  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();
  const {connected, account, web3Instance} = useWeb3Modal();
  const {average: gasPrice} = useETHGasPrice();

  const {txError, txEtherscanURL, txIsPromptOpen, txSend, txStatus} =
    useContractSend();

  const {proposalData, proposalSignAndSendStatus, signAndSendProposal} =
    useSignAndSubmitProposal<SnapshotType.proposal>();

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

  const {errors, getValues, setValue, register, trigger, watch} = form;
  const typeValue = watch('type');
  const isTypeAllMembers = typeValue === 'all members';
  const selectedTokenValue = watch('selectedToken');

  const createTransferError = submitError || txError;
  const isConnected = connected && account;
  const erc20ABI: AbiItem[] = ERC20ABI as any;

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
    erc20ABI,
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
    if (!account || !BankExtensionContract || !web3Instance) {
      setDaoTokens(undefined);
      return;
    }

    try {
      const {
        abi: bankABI,
        contractAddress: bankAddress,
        instance: {methods: bankMethods},
      } = BankExtensionContract;

      const nbTokens = await bankMethods.nbTokens().call();

      if (Number(nbTokens) < 1) {
        setDaoTokens([]);
      } else {
        let parsedAndSortedTokens: TokenDetails[] = [];

        // Build calls to get DAO token list with details
        const getTokenABI = bankABI.find((item) => item.name === 'getToken');
        const getTokenCalls = [...Array(Number(nbTokens)).keys()].map(
          (index): MulticallTuple => [
            bankAddress,
            getTokenABI as AbiItem,
            [index.toString()],
          ]
        );
        const fetchedTokens: string[] = await multicall({
          calls: getTokenCalls,
          web3Instance,
        });

        const balanceOfABI = bankABI.find((item) => item.name === 'balanceOf');
        const getDaoTokenBalanceCalls = fetchedTokens.map(
          (token): MulticallTuple => [
            bankAddress,
            balanceOfABI as AbiItem,
            [GUILD_ADDRESS, token],
          ]
        );
        const daoTokenBalances: string[] = await multicall({
          calls: getDaoTokenBalanceCalls,
          web3Instance,
        });

        const tokensArray: InitialTokenDetails[] = fetchedTokens
          .map((token, index) => ({
            address: token,
            daoBalance: daoTokenBalances[index],
          }))
          // Don't need to include tokens that have 0 balance
          .filter((tokenObj) => toBN(tokenObj.daoBalance).gt(toBN(0)));

        const ethToken = tokensArray.find(
          (token) => token.address === ETH_TOKEN_ADDRESS
        );
        if (ethToken) {
          parsedAndSortedTokens.push({
            ...ethToken,
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        // Filter out Ether to handle ERC20 tokens
        const erc20Tokens = tokensArray.filter(
          (token) => token.address !== ETH_TOKEN_ADDRESS
        );

        if (erc20Tokens.length > 0) {
          const nameABI = erc20ABI.find((item) => item.name === 'name');
          const nameCalls = erc20Tokens.map(
            (token): MulticallTuple => [
              token.address as string,
              nameABI as AbiItem,
              [],
            ]
          );
          const symbolABI = erc20ABI.find((item) => item.name === 'symbol');
          const symbolCalls = erc20Tokens.map(
            (token): MulticallTuple => [
              token.address as string,
              symbolABI as AbiItem,
              [],
            ]
          );
          const decimalsABI = erc20ABI.find((item) => item.name === 'decimals');
          const decimalsCalls = erc20Tokens.map(
            (token): MulticallTuple => [
              token.address as string,
              decimalsABI as AbiItem,
              [],
            ]
          );
          const erc20DetailsCalls = [
            ...nameCalls,
            ...symbolCalls,
            ...decimalsCalls,
          ];
          let results = await multicall({
            calls: erc20DetailsCalls,
            web3Instance,
          });
          let chunkedResults = [];
          while (results.length) {
            chunkedResults.push(results.splice(0, erc20Tokens.length));
          }
          const [names, symbols, decimals] = chunkedResults;

          const parsedAndSortedERC20Tokens = erc20Tokens
            .map((token, index) => ({
              ...token,
              name: names[index],
              symbol: symbols[index],
              decimals: decimals[index],
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          parsedAndSortedTokens = [
            ...parsedAndSortedTokens,
            ...parsedAndSortedERC20Tokens,
          ];
        }

        setDaoTokens(parsedAndSortedTokens);
      }
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
          'No user account was found. Please make sure your wallet is connected.'
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

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const {selectedToken, memberAddress, amount, notes} = values;
      const memberAddressToChecksum = toChecksumAddress(memberAddress);
      const selectedTokenObj = JSON.parse(selectedToken);
      const {symbol, decimals, address: tokenAddress} = selectedTokenObj;
      let amountArg;
      if (tokenAddress === ETH_TOKEN_ADDRESS) {
        amountArg = toWei(stripFormatNumber(amount), 'ether');
      } else {
        const multiplier = toBN(10).pow(toBN(decimals));
        const amountWithDecimals = toBN(stripFormatNumber(amount)).mul(
          multiplier
        );
        amountArg = amountWithDecimals.toString();
      }

      // Maybe set proposal info from previous attempt
      let proposalId: string = proposalData?.uniqueId || '';
      let data: SnapshotProposalData | undefined = proposalData?.data;
      let signature: string = proposalData?.signature || '';
      let submitter: string = proposalData?.submitter || '';

      const bodyIntro = isTypeAllMembers
        ? 'Transfer to all members pro rata.'
        : `Transfer to ${truncateEthAddress(memberAddressToChecksum, 7)}.`;

      // Values needed to display relevant proposal amounts in the proposal
      // details page are set in the snapshot draft metadata. (We can no longer
      // rely on getting this data from onchain because the proposal may not
      // exist there yet.)
      const proposalAmountValues = {
        transferAmount: amount,
        transferAmountUnit: symbol,
      };

      // Only submit to snapshot if there is not already a proposal ID returned from a previous attempt.
      if (!proposalId) {
        const body = notes ? `${bodyIntro}\n${notes}` : bodyIntro;
        const name = isTypeAllMembers ? 'All members' : memberAddressToChecksum;
        const now = Math.floor(Date.now() / 1000);

        // Sign and submit proposal for snapshot-hub
        const {
          uniqueId,
          data: returnData,
          signature: returnSignature,
          submitter: returnSubmitter,
        } = await signAndSendProposal({
          partialProposalData: {
            name,
            body,
            metadata: {
              proposalAmountValues,
              isTypeAllMembers,
            },
            timestamp: now.toString(),
          },
          adapterName: ContractAdapterNames.distribute,
          type: SnapshotType.proposal,
        });

        proposalId = uniqueId;
        data = returnData;
        signature = returnSignature;
        submitter = returnSubmitter;
      }

      const memberAddressArg = isTypeAllMembers
        ? BURN_ADDRESS // 0x0 address indicates distribution to all active members
        : memberAddressToChecksum;
      /**
       * Prepare `data` argument for submission to DAO
       *
       * For information about which data the smart contract needs for signature verification (e.g. `hashMessage`):
       * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting/OffchainVoting.sol
       */
      const preparedVoteVerificationBytes = data
        ? prepareVoteProposalData(
            {
              payload: {
                name: data.payload.name,
                body: data.payload.body,
                choices: data.payload.choices,
                snapshot: data.payload.snapshot.toString(),
                start: data.payload.start,
                end: data.payload.end,
              },
              submitter,
              sig: signature,
              space: data.space,
              timestamp: parseInt(data.timestamp),
            },
            web3Instance
          )
        : '';

      const transferArguments: TransferArguments = [
        DaoRegistryContract.contractAddress,
        proposalId,
        memberAddressArg,
        tokenAddress,
        amountArg,
        preparedVoteVerificationBytes,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
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
      const e = error as Error;

      setSubmitError(e);
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

    return formatNumber(selectedTokenBalance);
  }

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return (
        <>
          <p style={{color: '#697FD4'}}>
            Connect your wallet to submit a transfer proposal
          </p>
        </>
      );
    }

    // user is on wrong network
    if (defaultChainError) {
      return defaultChainError.message;
    }

    // user is not an active member
    if (!isActiveMember && !isAddressDelegated) {
      return 'Either you are not a member, or your membership is not active.';
    }

    // member has delegated to another address
    if (!isActiveMember && delegateAddress && isAddressDelegated) {
      return getDelegatedAddressMessage(delegateAddress);
    }
  }

  async function isActiveMemberWithUnits(address: string) {
    if (!BankExtensionContract) {
      console.error('No BankExtensionContract found.');
      return false;
    }

    const unitsBalance = await BankExtensionContract.instance.methods
      .balanceOf(address, UNITS_ADDRESS)
      .call();

    return toBN(unitsBalance).gt(toBN(0));
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
        {!isTypeAllMembers && (
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
                      : !(await isActiveMemberWithUnits(memberAddress))
                      ? 'The address is not an active member with membership tokens.'
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
                onChange={debounce(
                  () =>
                    setValue(
                      Fields.amount,
                      formatNumber(stripFormatNumber(getValues().amount))
                    ),
                  1000
                )}
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
              {isTypeAllMembers
                ? "If the proposal passes, this total amount will be distributed pro rata to all members' internal accounts, based on the current number of membership tokens held by each member."
                : "If the proposal passes, this amount will be distributed to the member's internal account."}
            </div>
          </div>

          <div className="form__input-addon">
            available: <span>{renderSelectedTokenBalance()}</span>
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
        {createTransferError && (
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
              You can propose a transfer of DAO tokens to a member. The DAO will
              vote on the proposal, and if it passes, the tokens will be
              transferred to the member's internal account.
            </p>
          </div>

          {/* RENDER CHILDREN */}
          {props.children}
        </div>
      </FadeIn>
    </Wrap>
  );
}
