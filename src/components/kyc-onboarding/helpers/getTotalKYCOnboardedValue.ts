import {BigNumber} from 'bignumber.js';
import Web3 from 'web3';

/**
 * Returns the total amount of wei contributed via `KycOnboarding`,
 * or empty `string`, if error.
 *
 * @param data `{ fromBlock?: number; kycOnboardingContractAddress: string; web3Instance: Web3;}`
 * @returns `string` Amount in wei
 */
export async function getTotalKYCOnboardedValue({
  fromBlock = 0,
  kycOnboardingContractAddress,
  web3Instance,
}: {
  fromBlock?: number;
  kycOnboardingContractAddress: string;
  web3Instance: Web3;
}): Promise<string> {
  try {
    const result = (
      await Promise.all(
        // Get all transactions
        (
          await web3Instance.eth.getPastLogs({
            fromBlock,
            address: kycOnboardingContractAddress,
            topics: [
              web3Instance.utils.sha3('Onboarded(address,address,uint256)'),
            ],
          })
        )
          .map((log) => log.transactionHash)
          .map(async (tx) => await web3Instance.eth.getTransaction(tx))
      )
    )
      // Add transaction `value`s
      .reduce((total, {value}) => total.plus(value), new BigNumber('0'))
      // Round
      .toFixed();

    // Return value in wei
    return result;
  } catch (error) {
    throw error;
  }
}
