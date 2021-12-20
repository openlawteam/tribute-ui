import {sha3} from 'web3-utils';

import {DEFAULT_ETH_ADDRESS, getWeb3Instance} from '../../../test/helpers';
import {getTotalKYCOnboardedValue} from '.';

describe('getTotalKYCOnboardedValue unit tests', () => {
  const DEFAULT_LOGS_RESULT = [
    {
      address: DEFAULT_ETH_ADDRESS,
      blockHash:
        '0xf3164a8d6e39bf9421314fe621e3fad6a38596519fd1db3e80c25c19bc60c251',
      blockNumber: 13291054,
      data: '0x0000000000000000000000001d96d039d384d3eccad6f07aab27a49408a1cf2b000000000000000000000000750c31d2290c456fcca1c659b6add80e7a88f88100000000000000000000000000000000000000000000000000000000000186a0',
      id: 'log_534f18e7',
      logIndex: 456,
      removed: false,
      topics: [sha3('Onboarded(address,address,uint256)')],
      transactionHash:
        '0x13d460778ee6fe4595bc83c2b31fc742601e59ff9fe4025a1a42025b3bf79328',
      transactionIndex: 254,
    },
    {
      address: DEFAULT_ETH_ADDRESS,
      blockHash:
        '0x6b13513da31b8e38e55e6ee2bfb268d08eeb9ea6ecb6794d5a32ee0e22dd0a91',
      blockNumber: 13291089,
      data: '0x0000000000000000000000001d96d039d384d3eccad6f07aab27a49408a1cf2b0000000000000000000000006ef2376fa6e12dabb3a3ed0fb44e4ff29847af6800000000000000000000000000000000000000000000000000000000000493e0',
      id: 'log_b050a13b',
      logIndex: 48,
      removed: false,
      topics: [sha3('Onboarded(address,address,uint256)')],
      transactionHash:
        '0xae193dfeafd4a2387c119eef43ff5bc82d8a4f19cc40f44e13dd69aa3165e882',
      transactionIndex: 42,
    },
  ];

  const DEFAULT_TX_RESULT = {
    accessList: [],
    blockHash:
      '0x82f58a5b42547cc349d592dbb9467a5bac33aaac164a79b20063949314f8b556',
    blockNumber: 13332710,
    chainId: '0x1',
    from: '0x8EC0103a6700f710Cf80412f0F8CC6390f622dd0',
    gas: 418378,
    gasPrice: '77102272266',
    hash: '0xa46892a2a4742b33467f81339ef3019c21360fec7163307dd18ca7c3fc61770a',
    input:
      '0x044ce0290000000000000000000000001d96d039d384d3eccad6f07aab27a49408a1cf2b0000000000000000000000008ec0103a6700f710cf80412f0f8cc6390f622dd000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000041ce2e3a00cff2b45412a90c3a1179f29b4fe7f0715a64bcef4a86a498222d9b737656c573abfde9c8f8d3f1025c848375e9ed614daf47671cdace0cb0bee196fb1b00000000000000000000000000000000000000000000000000000000000000',
    maxFeePerGas: '100000000000',
    maxPriorityFeePerGas: '3000000000',
    nonce: 34,
    r: '0x4576cbfa16dbf7b9208f52a7490650b66d8d82ffb3afe57b287e2f85f6d9fc2a',
    s: '0x7674ad69afd744ee9afae0792a026568cc976c8dbd32b6bafcd06f70498dfd58',
    to: '0x3e9425919E7F806ff0D4c29869f59e55970385fA',
    transactionIndex: 371,
    type: 2,
    v: '0x1',
    value: '50000000000000000000',
  };

  test('should return ether amount', async () => {
    const {mockWeb3Provider, web3} = getWeb3Instance();

    // Mock `getPastLogs` response
    mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    // Mock `getTransaction` response
    mockWeb3Provider.injectResult(DEFAULT_TX_RESULT);
    mockWeb3Provider.injectResult(DEFAULT_TX_RESULT);

    expect(
      await getTotalKYCOnboardedValue({
        kycOnboardingContractAddress: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
      })
    ).toBe('100000000000000000000');
  });

  test('should return empty string on error', async () => {
    const WEB3_ERROR = {code: 1234, message: 'Some bad error'};

    const {mockWeb3Provider, web3} = getWeb3Instance();

    // Mock `getPastLogs` response
    mockWeb3Provider.injectResult(DEFAULT_LOGS_RESULT);
    // Mock `getTransaction` response
    mockWeb3Provider.injectError(WEB3_ERROR);

    let error;

    try {
      await getTotalKYCOnboardedValue({
        kycOnboardingContractAddress: DEFAULT_ETH_ADDRESS,
        web3Instance: web3,
      });
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(WEB3_ERROR);
  });
});
