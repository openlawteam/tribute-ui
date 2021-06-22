import {Contract, SendOptions} from 'web3-eth-contract/types';
import {TransactionReceipt} from 'web3-core/types';
import BigNumber from 'bignumber.js';

/**
 * contractSend
 *
 * Returns the resolved transaction receipt or error
 *
 * @param {string} methodName
 * @param {Record<string, any>} contractInstanceMethods An object of the methods for the Web3 contract instance.
 * @param {any[]} methodArguments An array of any arguments for the contract's method.
 * @param {Record<string, any>} txArguments
 * @param {(txHash: string) => void} onProcess Callback which runs after a txHash has been received,
 *   but before the transaction is complete.
 * @returns {Promise<TransactionReceipt>} Resolved or rejected transaction.
 */
export async function contractSend(
  methodName: string,
  contractInstanceMethods: typeof Contract.prototype.methods,
  methodArguments: any[],
  txArguments: SendOptions,
  onProcess?: (txHash: string) => void
): Promise<TransactionReceipt> {
  // Promisify so we can both `reject()` inside .on('error') and from transactions.
  return new Promise<TransactionReceipt>(async (resolve, reject) => {
    try {
      const BN = BigNumber;
      const method = contractInstanceMethods[methodName];

      // estimate gas limit for transaction
      const gas = await method(...methodArguments).estimateGas({
        from: txArguments.from,
        value: txArguments.value,
      });

      const gastoBN = new BN(gas)
        .decimalPlaces(0, BigNumber.ROUND_DOWN)
        .toNumber();

      await method(...methodArguments)
        .send({
          ...txArguments,
          gas: gastoBN,
        })
        .on('transactionHash', function (txHash: string) {
          // Call onProcess with transaction hash
          onProcess && onProcess(txHash);
        })
        .on('receipt', function (receipt: TransactionReceipt) {
          // resolve on transaction receipt; contains event returnValues
          resolve(receipt);
        })
        .on('error', (error: Error) => {
          // reject on transaction error
          reject(error);
        });
    } catch (error) {
      // reject on estimate gas or transaction error
      reject(error);
    }
  });
}
