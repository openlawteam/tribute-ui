import {Web3TxStatus} from '../../../util/enums';

export type ContractSendType = {
  txHash?: string;
  txStatus: string;
  receipt?: Record<string, any>;
  error?: Error;
};

/**
 * contractSend
 *
 * Returns the resolved transaction receipt or error
 *
 * @param {any} contractInstance
 * @param {any} methodArguments
 * @param {string} methodName
 * @param {Record<string, any>} txArguments
 * @param {(txHash: string) => void} callback
 * @returns {Promise<ContractSendType>} Resolved transaction receipt or error
 */
export async function contractSend(
  methodName: string,
  contractInstance: any,
  methodArguments: any, // args passed as an array
  txArguments: Record<string, any>,
  callback: (txHash: string) => void // callback; return txHash
): Promise<ContractSendType> {
  return new Promise<ContractSendType>((resolve, reject) => {
    // estimate gas limit for transaction
    contractInstance[methodName](...methodArguments)
      .estimateGas({from: txArguments.from})
      .then((gas: number) => {
        contractInstance[methodName](...methodArguments)
          .send({
            ...txArguments,
            gas,
          })
          .on('transactionHash', function (txHash: string) {
            // return transaction hash
            callback(txHash);
          })
          .on('receipt', function (receipt: Record<string, any>) {
            // return transaction receipt; contains event returnValues
            resolve({
              receipt,
              txStatus: Web3TxStatus.FULFILLED,
            } as ContractSendType);
          })
          .on('error', (error: Error) => {
            // return transaction error
            reject({
              error,
              txStatus: Web3TxStatus.REJECTED,
            } as ContractSendType);
          });
      })
      .catch((error: Error) => {
        // return estimateGas error
        reject({
          error,
          txStatus: Web3TxStatus.REJECTED,
        } as ContractSendType);
      });
  });
}
