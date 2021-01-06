import {ContractSendType} from './types';
import {Web3TxStatus} from './enums';

/**
 * formatEthereumAddress
 *
 * Formats truncated Ethereum address.
 *
 * @param {string} addr
 * @param {number} [maxLength=5]
 * @returns {string}
 */
export function formatEthereumAddress(
  addr: string,
  maxLength: number = 5
): string {
  if (addr === null) return '---';

  if (typeof addr !== 'undefined' && addr.length > 9) {
    const firstSegment = addr.substring(0, maxLength);
    const secondPart = addr.substring(addr.length - 3);
    return firstSegment + '...' + secondPart;
  } else {
    return '---';
  }
}

/**
 * chooseRandom
 *
 * Choose a random item from an array.
 *
 * @param {array} array - The array to choose from.
 * @param doNotChooseItem - An item to not choose (e.g. previously chosen item)
 */
export function chooseRandom<T>(array: T[], doNotChooseItem?: T) {
  const arrayToUse =
    doNotChooseItem !== undefined
      ? array.filter((a) => a !== doNotChooseItem)
      : array;

  return arrayToUse[Math.floor(Math.random() * arrayToUse.length)];
}

/**
 * stripTrailingZeroes
 *
 * Strips trailing zeros after a decimal if there
 * is 1 or more at the end.
 *
 * Example:
 *
 * 1.10000 => 1.1
 * 1.100100 => 1.1001
 * 1.000 => 1
 * 1 >= 1
 *
 * @param {string | number} data
 * @returns {string}
 * @see https://stackoverflow.com/a/58896161
 */
export function stripTrailingZeroes(data: string | number): string {
  return data
    .toString()
    .replace(/^([\d,]+)$|^([\d,]+)\.0*$|^([\d,]+\.[0-9]*?)0*$/, '$1$2$3');
}

/**
 * formatDecimal
 *
 * A simple formatter with respect for dynamic decimal places
 * from `toFixed(2)` to `toFixed(4)`. If the number provided
 * is less than `0.01`, then `toFixed(4)` is used, else `toFixed(2)`.
 *
 * This may not work for all cases where the number is tiny, as it could
 * result in `"0.0000"`.
 *
 * @param {number} n
 * @returns {string} A `.toFixed()` representation of the decimal number.
 */
export function formatDecimal(n: number): string {
  return n < 0.01 ? n.toFixed(4) : n.toFixed(2);
}

/**
 * getValidationError
 *
 * Used with react-hook-form (mostly to solve a TS incorrect behavior)
 * Gets the associated error message with a field.
 *
 * @param {string} field
 * @param {Record<string, any>} errors
 * @returns string
 */
export function getValidationError(
  field: string,
  errors: Record<string, any>
): string {
  return errors[field] && 'message' in errors[field]
    ? (errors[field].message as string)
    : '';
}

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

/**
 * dontCloseWindowWarning
 *
 * Warns user not to close the window.
 *
 * @returns {() => void} unsubscribe function to stop listening, and the callback from firing.
 */
export function dontCloseWindowWarning(): () => void {
  // @see: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#Example
  const callback = (event: BeforeUnloadEvent) => {
    // Cancel the event
    event.preventDefault();
    // Chrome requires returnValue to be set
    event.returnValue = '';
  };

  window.addEventListener('beforeunload', callback);

  return function unsubscribe() {
    window.removeEventListener('beforeunload', callback);
  };
}

/**
 * formatNumber
 *
 * Formats a number (U.S. region) with commas (e.g. 1000 -> 1,000).
 *
 * @param {string | number} value
 * @returns {string}
 *
 * @todo maybe a more friendly way via Intl API in JS core?
 */
export const formatNumber = (value: number | string): string => {
  const regEx = new RegExp(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g);
  return typeof value === 'number'
    ? value.toString().replace(/,/g, '').replace(regEx, '$1,')
    : value.replace(/,/g, '').replace(regEx, '$1,');
};

/**
 * stripFormatNumber
 *
 * Strips a number string formatting (via `formatNumber`) (e.g. 10,000 -> 10000).
 *
 * @param {string} value Number string to strip formatting (via `formatNumber`) from.
 * @returns {string} A Number string without any formatting form `formatNumber`.
 *
 * @todo maybe a more friendly way via Intl API in JS core?
 */
export const stripFormatNumber = (value: string): string =>
  value.toString().replace(/,/g, '');

/**
 * disableReactDevTools
 *
 * Run before the app mounts to disable React dev tools.
 * Ideally, this is run conditionally based on environment.
 *
 * @see: https://github.com/facebook/react-devtools/issues/191#issuecomment-443607190
 */
export function disableReactDevTools() {
  const noop = (): void => undefined;
  const DEV_TOOLS = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (typeof DEV_TOOLS === 'object') {
    for (const [key, value] of Object.entries(DEV_TOOLS)) {
      DEV_TOOLS[key] = typeof value === 'function' ? noop : null;
    }
  }
}
