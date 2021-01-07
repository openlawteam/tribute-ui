import {useState} from 'react';
import {useSelector} from 'react-redux';
import {TransactionReceipt} from 'web3-core/types';

import {CHAINS, ETHERSCAN_URLS} from '../../../config';
import {contractSend} from '../helpers';
import {dontCloseWindowWarning} from '../../../util/helpers';
import {StoreState} from '../../../util/types';
import {Web3TxStatus} from '../types';

type UseContractSendReturn = {
  txError: Error | undefined;
  txEtherscanURL: string;
  txIsPromptOpen: boolean;
  txReceipt: TransactionReceipt | undefined;
  txSend: (
    ...p: Parameters<typeof contractSend>
  ) => Promise<TransactionReceipt | undefined>;
  txStatus: Web3TxStatus;
};

/**
 * useContractSend
 *
 * A React hook which encapsulates the call and related values of `contractSend`.
 *
 * @returns {UseContractSendReturn}
 */
export function useContractSend(): UseContractSendReturn {
  const [txError, setTxError] = useState<Error>();
  const [txEtherscanURL, setTxEtherscanURL] = useState<string>('');
  const [txIsPromptOpen, setTxIsPromptOpen] = useState<boolean>(false);
  const [txReceipt, setTxReceipt] = useState<TransactionReceipt>();
  const [txStatus, setTxStatus] = useState<Web3TxStatus>(Web3TxStatus.STANDBY);

  /**
   * Selectors
   */

  const chainId = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );

  /**
   * Functions
   */

  function handleOnTxProcess(callback: (txh: string) => void) {
    return (txHash: string) => {
      setTxStatus(Web3TxStatus.PENDING);
      setTxIsPromptOpen(false);

      // Ganache transactions do not show on Etherscan.
      if (chainId !== CHAINS.GANACHE) {
        setTxEtherscanURL(`${ETHERSCAN_URLS[chainId]}/tx/${txHash}`);
      }

      callback(txHash);
    };
  }

  async function txSend(
    ...contractSendParams: Parameters<typeof contractSend>
  ) {
    // Activate "don't close window" warning
    const unsubscribeDontCloseWindow = dontCloseWindowWarning();

    try {
      // Reset state in case trying again after error.
      setTxError(undefined);
      setTxEtherscanURL('');

      setTxStatus(Web3TxStatus.AWAITING_CONFIRM);
      setTxIsPromptOpen(true);

      // Intercept the on process callback to allow us to set our internal state.
      contractSendParams[4] = handleOnTxProcess(contractSendParams[4]);

      const receipt = await contractSend(...contractSendParams);

      setTxReceipt(receipt);
      setTxStatus(Web3TxStatus.FULFILLED);

      unsubscribeDontCloseWindow();

      return receipt;
    } catch (error) {
      setTxError(error);
      setTxStatus(Web3TxStatus.REJECTED);
      setTxIsPromptOpen(false);

      unsubscribeDontCloseWindow();
    }
  }

  return {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txReceipt,
    txSend,
    txStatus,
  };
}
