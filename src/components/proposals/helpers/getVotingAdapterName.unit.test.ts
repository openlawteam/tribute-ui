import {AbiItem} from 'web3-utils/types';

import {DAO_REGISTRY_CONTRACT_ADDRESS, DEFAULT_CHAIN} from '../../../config';
import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {getVotingAdapterName} from '.';
import {VotingAdapterName} from '../../adpaters/enums';
import ManagingABI from '../../../truffle-contracts/ManagingContract.json';

describe('getVotingAdapterName unit tests', () => {
  test('should return voting adapter name', async () => {
    const {web3, mockWeb3Provider} = getWeb3Instance();
    const instance = new web3.eth.Contract(
      ManagingABI as AbiItem[],
      DEFAULT_ETH_ADDRESS
    );

    const result: [string] = [
      web3.eth.abi.encodeParameter(
        'string',
        VotingAdapterName.OffchainVotingContract
      ),
    ];

    // Inject Web3 result for `getVotingAdapterName.call()`
    mockWeb3Provider.injectResult(...result);

    const address = await getVotingAdapterName(
      instance,
      DAO_REGISTRY_CONTRACT_ADDRESS[DEFAULT_CHAIN] || ''
    );

    expect(address).toBe('OffchainVotingContract');
  });
});
