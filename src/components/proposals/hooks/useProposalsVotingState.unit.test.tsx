import {renderHook, act} from '@testing-library/react-hooks';

import {useProposalsVotingState} from './useProposalsVotingState';
import Wrapper from '../../../test/Wrapper';
import {DEFAULT_PROPOSAL_HASH} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';

describe('useProposalsVotingState unit tests', () => {
  const proposalIds = [
    DEFAULT_PROPOSAL_HASH,
    DEFAULT_PROPOSAL_HASH,
    DEFAULT_PROPOSAL_HASH,
  ];

  test('should return correct hook state', async () => {
    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingState(proposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              // Mock proposals' voting state multicall response
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // VotingState.NOT_STARTED
                      web3Instance.eth.abi.encodeParameter('uint8', '0'),
                      // VotingState.PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '2'),
                      // VotingState.NOT_PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '3'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.PENDING
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.FULFILLED
      );

      expect(result.current.proposalsVotingState).toMatchObject([
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
          '0',
        ],
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
          '2',
        ],
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
          '3',
        ],
      ]);
    });
  });

  test('should throw if bad proposalIds not bytes32[]', async () => {
    const badProposalIds = ['abc123', 'abc456'];

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingState(badProposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              // Mock proposals' voting state multicall response
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // VotingState.NOT_STARTED
                      web3Instance.eth.abi.encodeParameter('uint8', '0'),
                      // VotingState.PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '2'),
                      // VotingState.NOT_PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '3'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.REJECTED
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);
    });
  });

  test('should not run if empty array of proposalIds', async () => {
    const emptyProposalIds: string[] = [];

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingState(emptyProposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              // Mock proposals' voting state multicall response
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      // VotingState.NOT_STARTED
                      web3Instance.eth.abi.encodeParameter('uint8', '0'),
                      // VotingState.PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '2'),
                      // VotingState.NOT_PASS
                      web3Instance.eth.abi.encodeParameter('uint8', '3'),
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );

      expect(result.current.proposalsVotingState).toMatchObject([]);
    });
  });
});
