import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
import {getConnectedMember} from '../../store/actions';
import {getContractByAddress} from '../web3/helpers';
import {ProposalData} from './types';
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

type ProcessArguments = [
  string, // `dao`
  string // `proposalId`
];

type ProcessActionProps = {
  disabled?: boolean;
  proposal: ProposalData;
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

export default function ProcessAction(props: ProcessActionProps) {
  const {
    disabled: propsDisabled,
    proposal: {snapshotProposal},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

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

  const {account, web3Instance} = useWeb3Modal();
  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();
  const {average: gasPrice} = useETHGasPrice();

  const {isDisabled, openWhyDisabledModal, WhyDisabledModal} =
    useMemberActionDisabled(useMemberActionDisabledProps);

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
   * Functions
   */

  async function handleSubmit() {
    try {
      if (!daoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!account) {
        throw new Error('No account found.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      const contract = getContractByAddress(
        snapshotProposal.actionId,
        contracts
      );

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
        contract.instance.methods,
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
      }
    } catch (error) {
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

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
