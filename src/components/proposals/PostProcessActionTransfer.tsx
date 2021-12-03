import {useEffect, useState, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
import {getConnectedMember} from '../../store/actions';
import {ProposalData, DistributionStatus} from './types';
import {ReduxDispatch, StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';

type DistributeArguments = [
  string, // `dao`
  string // `toIndex`
];

type PostProcessActionTransferProps = {
  proposal: ProposalData;
};

type ActionDisabledReasons = {
  alreadyCompletedMessage: string;
};

export default function PostProcessActionTransfer(
  props: PostProcessActionTransferProps
) {
  const {
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    alreadyCompletedMessage: '',
  });

  /**
   * Selectors
   */

  const DistributeContract = useSelector(
    (s: StoreState) => s.contracts?.DistributeContract
  );
  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );
  const bankExtensionContract = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract
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
  } = useMemberActionDisabled();

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
  const areSomeDisabled = isDisabled || isInProcessOrDone;

  /**
   * Effects
   */

  useEffect(() => {
    async function getActionDisabledReasons() {
      // 1. Determine and set reasons why action would be disabled

      // Reason: distribution already completed
      try {
        if (!snapshotProposal) {
          throw new Error('No Snapshot proposal was found.');
        }

        if (!daoRegistryContract) {
          throw new Error('No DAO Registry contract was found.');
        }

        if (!DistributeContract) {
          throw new Error('No DistributeContract found.');
        }

        const distributeProposal = await DistributeContract.instance.methods
          .distributions(
            daoRegistryContract.contractAddress,
            snapshotProposal.idInDAO
          )
          .call();

        actionDisabledReasonsRef.current = {
          ...actionDisabledReasonsRef.current,
          alreadyCompletedMessage:
            DistributionStatus[distributeProposal.status] !==
            DistributionStatus[DistributionStatus.IN_PROGRESS]
              ? 'The transfer has already been completed.'
              : '',
        };
      } catch (error) {
        console.error(error);
      }

      // 2. Set reasons
      setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
    }

    getActionDisabledReasons();
  }, [
    DistributeContract,
    daoRegistryContract,
    setOtherDisabledReasons,
    snapshotProposal,
  ]);

  /**
   * Functions
   */

  async function handleSubmit() {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!bankExtensionContract) {
        throw new Error('No Bank Extension contract was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!DistributeContract) {
        throw new Error('No DistributeContract found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      let toIndexArg = '0';

      const isTypeAllMembers =
        snapshotProposal?.msg.payload.metadata.isTypeAllMembers;

      if (isTypeAllMembers) {
        try {
          const nbMembers = await daoRegistryContract.instance.methods
            .getNbMembers()
            .call();
          toIndexArg = nbMembers.toString();
        } catch (error) {
          throw new Error('Error while retrieving number of DAO members');
        }
      }

      const distributeArguments: DistributeArguments = [
        daoRegistryContract.contractAddress,
        toIndexArg,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      const tx = await txSend(
        'distribute',
        DistributeContract.instance.methods,
        distributeArguments,
        txArguments
      );

      if (tx) {
        // re-fetch member
        await dispatch(
          getConnectedMember({
            account,
            daoRegistryContract,
            bankExtensionContract,
            web3Instance,
          })
        );
      }
    } catch (error) {
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

  function renderSubmitStatus(): React.ReactNode {
    // distribute transaction statuses
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Confirm to transfer assets
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
            <div>Assets transferred!</div>

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
          {isInProcess ? (
            <Loader />
          ) : isDone ? (
            'Transfer done'
          ) : (
            'Transfer assets'
          )}
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
            Why is action disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is transfer disabled?" />
    </>
  );
}
