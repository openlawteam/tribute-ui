import {useState} from 'react';
import {useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
import {StoreState} from '../../store/types';
import {truncateEthAddress} from '../../util/helpers';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useDao} from '../../hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';
import Modal from '../common/Modal';
import TimesSVG from '../../assets/svg/TimesSVG';

type FinalizeModalProps = {
  isOpen: boolean;
  closeHandler: () => void;
};

export default function FinalizeModal({
  isOpen,
  closeHandler,
}: FinalizeModalProps) {
  /**
   * State
   */
  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Selectors
   */
  const {DaoRegistryContract} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * Our hooks
   */

  const {txError, txEtherscanURL, txIsPromptOpen, txSend, txStatus} =
    useContractSend();

  const {dao} = useDao();
  const {connected, account} = useWeb3Modal();
  const {average: gasPrice} = useETHGasPrice();

  /**
   * Variables
   */

  const TIMEOUT_INTERVAL = 3000;
  const isConnected = connected && account;

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;

  const isDone = txStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;
  const finalizeError = submitError || txError;

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
            <div>{'Finalized!'}</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  function configureExtensions() {
    // @todo if any adapters have the `setAclToExtensionForAdapter` flag set we need to call
    //  `configureExtension(
    //     DaoRegistry dao,
    //     address extension,
    //     Adapter[] calldata adapters
    // )` to set the permission for those adapters for the bank before finalizing the DAO
    /**
     * STEPS
     * - get all added adapters from the subgraph
     * - check the `setAclToExtensionForAdapter` flag against the added adpaters
     * - set the permission for any adapters that are required
     */
  }

  async function finalizeDao(): Promise<void> {
    try {
      if (!isConnected) {
        throw new Error(
          'No user account was found. Please make sure your wallet is connected.'
        );
      }

      if (!DaoRegistryContract) {
        throw new Error('No DAO Registry contract was found.');
      }

      // @todo set permissions for adapters
      configureExtensions();

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call for `finalizeDao`
      await txSend(
        'finalizeDao',
        DaoRegistryContract.instance.methods,
        [],
        txArguments
      );

      // Close modal
      closeHandler &&
        setTimeout(() => {
          closeHandler();
        }, TIMEOUT_INTERVAL);
    } catch (error) {
      const e = error as Error;

      setSubmitError(e);
    }
  }

  return (
    <Modal
      keyProp="adapter-extension-finalize"
      isOpen={isOpen}
      isOpenHandler={() => {
        closeHandler();
      }}>
      {/* MODEL CLOSE BUTTON */}
      <>
        <span
          className="modal__close-button"
          onClick={() => {
            closeHandler();
          }}>
          <TimesSVG />
        </span>

        <h1>Finalize</h1>
        <h2>
          {dao && dao.name}{' '}
          <small>{dao && truncateEthAddress(dao.daoAddress, 7)}</small>
        </h2>
        <p>
          After your DAO is finalized you will need to submit a proposal to make
          changes.
        </p>

        {/* SUBMIT */}
        <button
          className="button"
          disabled={isInProcessOrDone}
          onClick={() => {
            if (isInProcessOrDone) return;

            finalizeDao();
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
        {finalizeError && (
          <div className="form__submit-error-container">
            <ErrorMessageWithDetails
              renderText="Something went wrong while trying to finalize the DAO."
              error={finalizeError}
            />
          </div>
        )}
      </>
    </Modal>
  );
}
