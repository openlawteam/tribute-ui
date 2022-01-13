import {useState, useRef, useEffect, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AbiItem, toBN} from 'web3-utils';

import {CycleEllipsis} from '../feedback';
import {ETH_TOKEN_ADDRESS, ONBOARDING_TOKEN_ADDRESS} from '../../config';
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
  dao: string, // `dao`
  proposalId: string // `proposalId`
];

type TokenApproveArguments = [
  spender: string, // `spender`
  amount: string // `amount`
];

type ProcessActionOnboardingProps = {
  disabled?: boolean;
  proposal: ProposalData;
};

type BN = ReturnType<typeof toBN>;

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

const isERC20Onboarding = ONBOARDING_TOKEN_ADDRESS !== ETH_TOKEN_ADDRESS;

function renderSubmitStatus({
  txEtherscanURL,
  txStatus,
  txEtherscanURLTokenApprove,
  txStatusTokenApprove,
}: {
  txEtherscanURL: string;
  txStatus: Web3TxStatus;
  txEtherscanURLTokenApprove: string;
  txStatusTokenApprove: string;
}): React.ReactNode {
  // token approve transaction statuses
  if (txStatusTokenApprove === Web3TxStatus.AWAITING_CONFIRM) {
    return (
      <>
        Confirm to transfer your tokens
        <CycleEllipsis intervalMs={500} />
      </>
    );
  }

  if (txStatusTokenApprove === Web3TxStatus.PENDING) {
    return (
      <>
        <div>
          Approving your tokens for transfer
          <CycleEllipsis intervalMs={500} />
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
          <CycleEllipsis intervalMs={500} />
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
          <div>Proposal processed!</div>

          <EtherscanURL url={txEtherscanURL} />
        </>
      );
    default:
      return null;
  }
}

export default function ProcessActionOnboarding(
  props: ProcessActionOnboardingProps
) {
  const {
    disabled: propsDisabled,
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  const [onboardingProposalAmount, setOnboardingProposalAmount] =
    useState<string>();

  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    notProposerMessage: '',
  });

  /**
   * Selectors
   */

  const OnboardingContract = useSelector(
    (s: StoreState) => s.contracts?.OnboardingContract
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

  const getOnboardingProposalAmountCached = useCallback(
    getOnboardingProposalAmount,
    [OnboardingContract, daoRegistryContract?.contractAddress, snapshotProposal]
  );

  /**
   * Effects
   */

  useEffect(() => {
    getOnboardingProposalAmountCached();
  }, [getOnboardingProposalAmountCached]);

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

  async function getOnboardingProposalAmount() {
    try {
      if (
        !daoRegistryContract?.contractAddress ||
        !OnboardingContract ||
        !snapshotProposal
      ) {
        return;
      }

      const proposalDetails = await OnboardingContract.instance.methods
        .proposals(
          daoRegistryContract.contractAddress,
          snapshotProposal.idInDAO
        )
        .call();

      setOnboardingProposalAmount(proposalDetails.amount);
    } catch (error) {
      console.error(error);
      setOnboardingProposalAmount(undefined);
    }
  }

  async function handleSubmitTokenApprove(erc20AmountBN: BN) {
    try {
      if (!ONBOARDING_TOKEN_ADDRESS) {
        throw new Error(
          'No Onboarding ERC20 address was found. Are you sure it is set?'
        );
      }

      if (!OnboardingContract) {
        throw new Error('No OnboardingContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const {default: lazyERC20ABI} = await import(
        '../../abis/external/ERC20.json'
      );
      const erc20Contract: AbiItem[] = lazyERC20ABI as any;

      const erc20Instance = new web3Instance.eth.Contract(
        erc20Contract,
        ONBOARDING_TOKEN_ADDRESS
      );

      // Value to check if adapter is allowed to spend amount of tribute tokens
      // on behalf of owner. If allowance is not sufficient, the owner will
      // approve the adapter to spend the amount of tokens needed for the owner
      // to provide the full tribute amount.
      const allowance = await erc20Instance.methods
        .allowance(account, OnboardingContract.contractAddress)
        .call();

      const allowanceBN = toBN(allowance);

      if (erc20AmountBN.gt(allowanceBN)) {
        const difference = erc20AmountBN.sub(allowanceBN);
        const approveAmount = allowanceBN.add(difference);
        const tokenApproveArguments: TokenApproveArguments = [
          OnboardingContract.contractAddress,
          String(approveAmount),
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

      if (!OnboardingContract) {
        throw new Error('No OnboardingContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!onboardingProposalAmount) {
        throw new Error('No proposal amount found.');
      }

      if (isERC20Onboarding) {
        // ERC20 onboarding
        const erc20AmountBN = toBN(onboardingProposalAmount);
        await handleSubmitTokenApprove(erc20AmountBN);
      }

      const processArguments: ProcessArguments = [
        daoRegistryContract.contractAddress,
        snapshotProposal.idInDAO,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
        ...(isERC20Onboarding ? null : {value: onboardingProposalAmount}),
      };

      const txReceipt = await txSend(
        'processProposal',
        OnboardingContract.instance.methods,
        processArguments,
        txArguments
      );

      if (txReceipt) {
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
      // Set any errors from Web3 utils or explicitly set above.
      const e = error as Error;

      setSubmitError(e);
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
            {renderSubmitStatus({
              txEtherscanURL,
              txStatus,
              txEtherscanURLTokenApprove,
              txStatusTokenApprove,
            })}
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
