import React, {useEffect, useState, useRef} from 'react';
import {useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
import {getContractByAddress} from '../web3/helpers';
import {ProposalData, DistributionStatus} from './types';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {ContractAdapterNames, Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';

type ProcessActionProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
};

type SubmitConfigs = {
  functionName: string;
  functionArguments: any[];
};

type ActionDisabledReasons = {
  alreadyCompletedMessage: string;
};

/**
 * @note Attempt to keep this component general to handle any adapters that may
 * have post-process actions
 */
export default function PostProcessAction(props: ProcessActionProps) {
  const {
    adapterName,
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

  const contracts = useSelector((s: StoreState) => s.contracts);
  const daoRegistryContract = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract
  );

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();

  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled();

  const gasPrices = useETHGasPrice();

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
      if (adapterName === ContractAdapterNames.distribute) {
        if (!snapshotProposal) {
          throw new Error('No Snapshot proposal was found.');
        }
        if (!daoRegistryContract) {
          throw new Error('No DAO Registry contract was found.');
        }

        try {
          const distributeContract = getContractByAddress(
            snapshotProposal.actionId,
            contracts
          );
          const distributeProposal = await distributeContract.instance.methods
            .distributions(
              daoRegistryContract.contractAddress,
              snapshotProposal.idInDAO
            )
            .call();

          actionDisabledReasonsRef.current = {
            ...actionDisabledReasonsRef.current,
            alreadyCompletedMessage:
              distributeProposal.status !== DistributionStatus.IN_PROGRESS
                ? 'The transfer has already been completed.'
                : '',
          };
        } catch (error) {
          console.error(error);
        }
      }

      // 2. Set reasons
      setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
    }

    getActionDisabledReasons();
  }, [
    adapterName,
    contracts,
    daoRegistryContract,
    setOtherDisabledReasons,
    snapshotProposal,
  ]);

  /**
   * Functions
   */

  async function getSubmitConfigsByAdapter(): Promise<SubmitConfigs> {
    switch (adapterName) {
      case ContractAdapterNames.distribute:
        if (!daoRegistryContract) {
          throw new Error('No DAO Registry contract was found.');
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

        return {
          functionName: 'distribute',
          functionArguments: [daoRegistryContract.contractAddress, toIndexArg],
        };
      default:
        return {functionName: '', functionArguments: []};
    }
  }

  async function handleSubmit() {
    try {
      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      const contract = getContractByAddress(
        snapshotProposal.actionId,
        contracts
      );

      const {
        functionName,
        functionArguments,
      } = await getSubmitConfigsByAdapter();

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      await txSend(
        functionName,
        contract.instance.methods,
        functionArguments,
        txArguments
      );
    } catch (error) {
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

  function renderSubmitStatusByAdapter(): string {
    switch (adapterName) {
      case ContractAdapterNames.distribute:
        return 'Assets transferred!';
      default:
        return 'Action submitted!';
    }
  }

  function renderButtonTextByAdapter(): {start: string; done: string} {
    switch (adapterName) {
      case ContractAdapterNames.distribute:
        return {start: 'Transfer assets', done: 'Transfer done'};
      default:
        return {start: 'Process action', done: 'Done'};
    }
  }

  function renderSubmitStatus(): React.ReactNode {
    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Awaiting your confirmation
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
            <div>{renderSubmitStatusByAdapter()}</div>

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
            renderButtonTextByAdapter()['done']
          ) : (
            renderButtonTextByAdapter()['start']
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
          <button className="button--help" onClick={openWhyDisabledModal}>
            Why is action disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is action disabled?" />
    </>
  );
}
