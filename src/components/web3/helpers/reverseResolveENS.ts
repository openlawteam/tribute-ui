import {AbiItem} from 'web3-utils/types';
import namehash from '@ensdomains/eth-ens-namehash';
import Web3 from 'web3';

import {CHAINS, DEFAULT_CHAIN} from '../../../config';
import {ReverseRecords} from '../../../abis/types/ReverseRecords';
import ReverseRecordsABI from '../../../abis/external/ReverseRecords.json';

/**
 * @see https://github.com/ensdomains/reverse-records#deployed-contract-address
 */
export const REVERSE_RECORDS_ADDRESS: Pick<
  Record<typeof CHAINS[keyof typeof CHAINS], string>,
  | typeof CHAINS.GOERLI
  | typeof CHAINS.MAINNET
  | typeof CHAINS.RINKEBY
  | typeof CHAINS.ROPSTEN
> = {
  [CHAINS.GOERLI]: '0x333Fc8f550043f239a2CF79aEd5e9cF4A20Eb41e',
  [CHAINS.MAINNET]: '0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C',
  [CHAINS.RINKEBY]: '0x196eC7109e127A353B709a20da25052617295F6f',
  [CHAINS.ROPSTEN]: '0x72c33B247e62d0f1927E8d325d0358b8f9971C68',
};

/**
 * ENS reverse resolution an ethereum address(es).
 * Forward resolution check is handled by the smart contract (see links).
 *
 * @param address `string | string[]`
 * @returns `string[]` The array returned will be the same length as the `addresses` argument.
 *   If the returned name is an empty `string`, or `namehash.normalize` check fails,
 *   the originally provided address `string` will be returned.
 *
 * @see https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
 * @see https://github.com/ensdomains/reverse-records
 * @see https://etherscan.io/address/0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C#code#F1#L39
 */
export async function reverseResolveENS(
  addresses: string[],
  web3Instance: Web3
): Promise<string[]> {
  const contractAddress = REVERSE_RECORDS_ADDRESS[DEFAULT_CHAIN];

  if (!contractAddress || !addresses || !addresses.length) {
    return addresses;
  }

  const contract = new web3Instance.eth.Contract(
    ReverseRecordsABI as any as AbiItem[],
    contractAddress
  ) as any as ReverseRecords;

  const names = await contract.methods.getNames(addresses).call();

  /**
   * Compare returned names match normalised names to prevent homograph attack
   *
   * @see https://github.com/ensdomains/reverse-records#usage-note
   */
  return names.map((n, i) =>
    n !== '' && namehash.normalize(n) === n ? n : addresses[i]
  );
}
