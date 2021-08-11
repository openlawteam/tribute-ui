import {AbiItem} from 'web3-utils/types';

import {ContractAdapterNames} from '../types';
import {DAO_REGISTRY_CONTRACT_ADDRESS} from '../../../config';
import {getWeb3Instance} from '../../../test/helpers';
import {multicall} from './multicall';
import DaoRegistryABI from '../../../abis/DaoRegistry.json';

describe('multicall unit tests', () => {
  test('should return correct data', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();

    // Mock the multicall response
    mockWeb3Provider.injectResult(
      web3.eth.abi.encodeParameters(
        ['uint256', 'bytes[]'],
        [
          0,
          [
            '0x000000000000000000000000ed882fe5746689f05721e90ff1c26f17f406195e',
            '0x000000000000000000000000ed882fe5746689f05721e90ff1c26f17f406195e',
          ],
        ]
      )
    );

    const daoRegistryABI: AbiItem[] = DaoRegistryABI as any;
    const filteredABI = daoRegistryABI.filter(
      (item) => item.name === 'getAdapterAddress'
    )[0];

    const res = await multicall({
      calls: [
        [
          DAO_REGISTRY_CONTRACT_ADDRESS || '',
          filteredABI,
          [web3.utils.sha3(ContractAdapterNames.voting) || ''],
        ],
        [
          DAO_REGISTRY_CONTRACT_ADDRESS || '',
          filteredABI,
          [web3.utils.sha3(ContractAdapterNames.onboarding) || ''],
        ],
      ],
      web3Instance: web3,
    });

    expect(res).toMatchObject([
      '0xEd882fE5746689f05721E90FF1C26f17F406195e',
      '0xEd882fE5746689f05721E90FF1C26f17F406195e',
    ]);
  });
});
