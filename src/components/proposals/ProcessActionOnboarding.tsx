import {useState, useRef, useEffect, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
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

type ProcessActionOnboardingProps = {
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
    txStatus === Web3TxStatus.PENDING;
  const isDone = txStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;
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

      const processArguments: ProcessArguments = [
        daoRegistryContract.contractAddress,
        snapshotProposal.idInDAO,
      ];

      const txArguments = {
        from: account || '',
        value: onboardingProposalAmount,
        ...(gasPrice ? {gasPrice} : null),
      };

      const tx = await txSend(
        'processProposal',
        OnboardingContract.instance.methods,
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
