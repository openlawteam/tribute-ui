import {DEFAULT_ETH_ADDRESS} from '../helpers';
import {TestWeb3ResponseArgs, TestWeb3ResponseReturn} from './types';

/**
 * getTransactionReceipt
 *
 * @param {TestWeb3ResponseArgs}
 * @returns {TestWeb3ResponseReturn<Record<string, any>>}
 * @see https://eth.wiki/json-rpc/API#eth_gettransactionreceipt
 */
export const getTransactionReceipt = ({
  result,
}: TestWeb3ResponseArgs): TestWeb3ResponseReturn<Record<string, any>> => [
  result ?? {
    transactionHash:
      '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
    transactionIndex: '0x1', // 1
    blockNumber: '0xb', // 11
    blockHash:
      '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
    cumulativeGasUsed: '0x33bc', // 13244
    gasUsed: '0x4dc', // 1244
    contractAddress: null,
    logs: [],
    logsBloom: DEFAULT_ETH_ADDRESS, // 256 byte bloom filter
    status: '0x1',
  },
  {debugName: '`getTransactionReceipt` helper'},
];
