import {SnapshotType} from '@openlaw/snapshot-js-erc712';
import {renderHook, act} from '@testing-library/react-hooks';

import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {ProposalData} from '../types';
import {useOffchainVotingResults} from './useOffchainVotingResults';
import {VoteChoices} from '../../web3/types';
import MulticallABI from '../../../truffle-contracts/Multicall.json';
import Wrapper from '../../../test/Wrapper';

describe('useOffchainVotingResults unit tests', () => {
  test('should return correct data', async () => {
    // @note Providing only data required (by the hook and just enough for TS).
    const fakeProposal: Partial<ProposalData> = {
      snapshotProposal: {
        msg: {
          payload: {
            snapshot: 123,
            name: '',
            body: '',
            choices: [VoteChoices.Yes, VoteChoices.No],
            metadata: {},
            start: 0,
            end: 0,
          },
          version: '',
          timestamp: '',
          token: '',
          type: SnapshotType.proposal,
        },
        actionId: '',
        address: '',
        authorIpfsHash: '',
        data: {authorIpfsHash: ''},
        idInDAO: '',
        idInSnapshot: '',
        relayerIpfsHash: '',
        sig: '',
        votes: [
          {
            DEFAULT_ETH_ADDRESS: {
              address: DEFAULT_ETH_ADDRESS,
              msg: {
                version: '0.2.0',
                timestamp: '1614264732',
                token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
                type: SnapshotType.vote,
                payload: {
                  choice: 1, // Yes
                  proposalHash:
                    '0x1679cac3f54777f5d9c95efd83beff9f87ac55487311ecacd95827d267a15c4e',
                  metadata: {
                    memberAddress: DEFAULT_ETH_ADDRESS,
                  },
                },
              },
              sig:
                '0xdbdbf122734b34ed5b10542551636e4250e98f443e35bf5d625f284fe54dcaf80c5bc44be04fefed1e9e5f25a7c13809a5266fcdbdcd0b94c885f2128544e79a1b',
              authorIpfsHash:
                '0xfe8f864ef475f60c7e01d5425df332199c5ae7ab712b8545f07433c68f06c644',
              relayerIpfsHash: '',
              actionId: '0xFCB86F90bd7b30cDB8A2c43FB15bf5B33A70Ea4f',
            },
          },
          {
            '0xc0437e11094275376defbe51dc6e04598403d276': {
              address: '0xc0437e11094275376defbe51dc6e04598403d276',
              msg: {
                version: '0.2.0',
                timestamp: '1614264732',
                token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
                type: SnapshotType.vote,
                payload: {
                  choice: 2, // No
                  proposalHash:
                    '0x1679cac3f54777f5d9c95efd83beff9f87ac55487311ecacd95827d267a15c4e',
                  metadata: {
                    memberAddress: '0xc0437e11094275376defbe51dc6e04598403d276',
                  },
                },
              },
              sig:
                '0xdbdbf122734b34ed5b10542551636e4250e98f443e35bf5d625f284fe54dcaf80c5bc44be04fefed1e9e5f25a7c13809a5266fcdbdcd0b94c885f2128544e79a1b',
              authorIpfsHash:
                '0xfe8f864ef475f60c7e01d5425df332199c5ae7ab712b8545f07433c68f06c644',
              relayerIpfsHash: '',
              actionId: '0xFCB86F90bd7b30cDB8A2c43FB15bf5B33A70Ea4f',
            },
          },
        ],
      },
    };

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useOffchainVotingResults(fakeProposal as ProposalData),
        {
          wrapper: Wrapper,
          initialProps: {
            getProps: ({mockWeb3Provider, web3Instance}) => {
              /**
               * @note We need to replace one of the mocked RPC responses in <Wrapper /> as there's a timing issue
               *   with when `useOffchainVotingResults` runs and tries to use the aforementioned RPC mock response.
               */
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      web3Instance.utils.padLeft(DEFAULT_ETH_ADDRESS, 64),
                      '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000164f6666636861696e566f74696e67436f6e747261637400000000000000000000',
                    ],
                  ]
                ),
                {abi: MulticallABI, abiMethodName: 'aggregate'}
              );

              // Inject mocked result
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      web3Instance.eth.abi.encodeParameter(
                        'uint256',
                        '10000000'
                      ),
                      web3Instance.eth.abi.encodeParameter('uint256', '200000'),
                      web3Instance.eth.abi.encodeParameter('uint256', '100000'),
                    ],
                  ]
                ),
                {abi: MulticallABI, abiMethodName: 'aggregate'}
              );
            },
            useInit: true,
            useWallet: true,
          },
        }
      );

      await waitForNextUpdate();
      await waitForNextUpdate();
      await waitForNextUpdate();

      expect(result.current?.Yes).toMatchObject({
        percentage: 2,
        shares: 200000,
      });
      expect(result.current?.No).toMatchObject({percentage: 1, shares: 100000});
    });
  });
});
