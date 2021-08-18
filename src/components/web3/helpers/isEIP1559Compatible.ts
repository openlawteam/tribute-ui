import {BlockTransactionBase} from 'web3-eth';
import Web3 from 'web3';

interface TemporaryBlockTxType extends BlockTransactionBase {
  baseFeePerGas?: string;
}

/**
 * Checks if the block header contains fields that indicate EIP-1559
 * support (i.e. `baseFeePerGas`).
 *
 * @todo Fix types once `web3-eth` types are up-to-date.
 *
 * @returns {Promise<boolean>} true if current network supports EIP-1559
 */
export async function isEIP1559Compatible(
  /**
   * May be arriving in async (from a hook),
   * hence the `undefined` type.
   */
  web3Instance: Web3 | undefined
): Promise<boolean> {
  const latestBlock = (await web3Instance?.eth.getBlock(
    'latest'
  )) as TemporaryBlockTxType;

  return latestBlock?.baseFeePerGas !== undefined;
}
