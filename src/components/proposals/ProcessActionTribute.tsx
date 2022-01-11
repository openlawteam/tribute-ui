import {toBN, AbiItem} from 'web3-utils';
import {useDispatch, useSelector} from 'react-redux';
import {useState, useRef, useEffect, useCallback} from 'react';

import {CycleEllipsis} from '../feedback';
import {ERC20} from '../../abis/types/ERC20';
import {getConnectedMember} from '../../store/actions';
import {ProposalData, SnapshotProposal} from './types';
import {ReduxDispatch, StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useDaoTokenDetails} from '../dao-token/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';

type ProcessArguments = [
  string, // `dao`
  string // `proposalId`
];

type TokenApproveArguments = [
  string, // `spender`
  string // `value`
];

type TributeProposalDetails = {
  tokenAddress: string;
  tributeAmount: string;
};

type ProcessActionTributeProps = {
  disabled?: boolean;
  proposal: ProposalData;
};

type ActionDisabledReasons = {
  notProposerMessage: string;
};

/**
 * Cached outside the component to prevent infinite re-renders.
 *
 * The same can be accomplished inside the component using
 * `useState`, `useRef`, etc., depending on the use case.
 */
const useMemberActionDisabledProps = {
  // Anyone can process a proposal - it's just a question of gas payment.
  skipIsActiveMemberCheck: true,
};

export default function ProcessActionTribute(props: ProcessActionTributeProps) {
  const {
    disabled: propsDisabled,
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  const [tributeProposalDetails, setTributeProposalDetails] =
    useState<TributeProposalDetails>();

  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    notProposerMessage: '',
  });

  /**
   * Selectors
   */

  const TributeContract = useSelector(
    (s: StoreState) => s.contracts?.TributeContract
  );
  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();
  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();
  const {average: gasPrice} = useETHGasPrice();

  const {
    txEtherscanURL: txEtherscanURLTokenApprove,
    txIsPromptOpen: txIsPromptOpenTokenApprove,
    txSend: txSendTokenApprove,
    txStatus: txStatusTokenApprove,
  } = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled(useMemberActionDisabledProps);

  const {daoTokenDetails} = useDaoTokenDetails();

  /**
   * Their hooks
   */

  const dispatch = useDispatch<ReduxDispatch>();

  /**
   * Variables
   */

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM ||
    txStatusTokenApprove === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone =
    isInProcess || isDone || txIsPromptOpen || txIsPromptOpenTokenApprove;

  const areSomeDisabled = isDisabled || isInProcessOrDone || propsDisabled;

  /**
   * Cached callbacks
   */

  const getTributeProposalDetailsCached = useCallback(
    getTributeProposalDetails,
    [TributeContract, daoRegistryContract?.contractAddress, snapshotProposal]
  );

  /**
   * Effects
   */

  useEffect(() => {
    getTributeProposalDetailsCached();
  }, [getTributeProposalDetailsCached]);

  useEffect(() => {
    // 1. Determine and set reasons why action would be disabled

    // Reason: For some proposal types, a passed proposal can only be
    // processed by its original proposer (e.g., the owner of the asset to be
    // transferred)

    // Proposals with this restriction will have this value stored in its
    // snapshot metadata.
    const {accountAuthorizedToProcessPassedProposal} = (
      snapshotProposal as SnapshotProposal
    ).msg.payload.metadata;

    if (accountAuthorizedToProcessPassedProposal && account) {
      actionDisabledReasonsRef.current = {
        ...actionDisabledReasonsRef.current,
        notProposerMessage:
          accountAuthorizedToProcessPassedProposal.toLowerCase() !==
          account.toLowerCase()
            ? 'Only the original proposer can process the proposal.'
            : '',
      };
    }

    // 2. Set reasons
    setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
  }, [account, setOtherDisabledReasons, snapshotProposal]);

  /**
   * Functions
   */

  async function getTributeProposalDetails() {
    try {
      if (
        !daoRegistryContract?.contractAddress ||
        !snapshotProposal ||
        !TributeContract
      ) {
        return;
      }

      const proposalDetails = await TributeContract.instance.methods
        .proposals(
          daoRegistryContract.contractAddress,
          snapshotProposal.idInDAO
        )
        .call();

      const {token: tokenAddress, tributeAmount} = proposalDetails;

      setTributeProposalDetails({tokenAddress, tributeAmount});
    } catch (error) {
      console.error(error);
      setTributeProposalDetails(undefined);
    }
  }

  async function handleSubmitTokenApprove() {
    try {
      if (!tributeProposalDetails) {
        throw new Error('No Tribute proposal details found.');
      }

      if (!TributeContract) {
        throw new Error('No TributeContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const {tokenAddress, tributeAmount} = tributeProposalDetails;

      const {default: lazyERC20ABI} = await import(
        '../../abis/external/ERC20.json'
      );
      const erc20Contract: AbiItem[] = lazyERC20ABI as any;

      const erc20Instance = new web3Instance.eth.Contract(
        erc20Contract,
        tokenAddress
      ) as any as ERC20; // TypeChain: for Web3 we need to cast

      // Value to check if adapter is allowed to spend amount of tribute tokens
      // on behalf of owner. If allowance is not sufficient, the owner will approve the adapter to spend the amount of
      // tokens needed for the owner to provide the full tribute amount.
      const allowance = await erc20Instance.methods
        .allowance(account, TributeContract.contractAddress)
        .call();

      const tributeAmountBN = toBN(tributeAmount);
      const allowanceBN = toBN(allowance);

      if (tributeAmountBN.gt(allowanceBN)) {
        try {
          const difference = tributeAmountBN.sub(allowanceBN);
          const approveValue = allowanceBN.add(difference);
          const tokenApproveArguments: TokenApproveArguments = [
            TributeContract.contractAddress,
            approveValue.toString(),
          ];
          const txArguments = {
            from: account || '',
            ...(gasPrice ? {gasPrice} : null),
          };

          // Execute contract call for `approve`
          await txSendTokenApprove(
            'approve',
            erc20Instance.methods,
            tokenApproveArguments,
            txArguments
          );
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async function handleSubmit() {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!TributeContract) {
        throw new Error('No TributeContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      await handleSubmitTokenApprove();

      const processArguments: ProcessArguments = [
        daoRegistryContract.contractAddress,
        snapshotProposal.idInDAO,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      const tx = await txSend(
        'processProposal',
        TributeContract.instance.methods,
        processArguments,
        txArguments
      );

      if (tx) {
        // re-fetch member
        await dispatch(
          getConnectedMember({
            account,
            daoRegistryContract,
            web3Instance,
          })
        );

        // if connected account is the applicant (the address that will receive
        // the membership units) suggest adding DAO token to wallet
        if (
          account.toLowerCase() ===
          snapshotProposal.msg.payload.metadata.submitActionArgs[0].toLowerCase()
        ) {
          await addTokenToWallet();
        }
      }
    } catch (error) {
      setSubmitError(error);
    }
  }

  async function addTokenToWallet() {
    if (!daoTokenDetails) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: daoTokenDetails,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Render
   */

  function renderSubmitStatus(): React.ReactNode {
    // token approve transaction statuses
    if (txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM) {
      return (
        <>
          Confirm to transfer your tokens
          <CycleEllipsis />
        </>
      );
    }

    if (txStatusTokenApprove === Web3TxStatus.PENDING) {
      return (
        <>
          <div>
            Approving your tokens for transfer
            <CycleEllipsis />
          </div>
          <EtherscanURL url={txEtherscanURLTokenApprove} isPending />
        </>
      );
    }

    // process proposal transaction statuses
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Confirm to process the proposal
            <CycleEllipsis />
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
            <div>Proposal submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div>
        <button
          className="proposaldetails__button"
          disabled={areSomeDisabled}
          onClick={areSomeDisabled ? () => {} : handleSubmit}>
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Process'}
        </button>

        <ErrorMessageWithDetails
          error={submitError}
          renderText="Something went wrong"
        />

        {/* SUBMIT STATUS */}

        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {renderSubmitStatus()}
          </div>
        )}

        {isDisabled && (
          <button
            className="button--help-centered"
            onClick={openWhyDisabledModal}>
            Why is processing disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is processing disabled?" />
    </>
  );
}
