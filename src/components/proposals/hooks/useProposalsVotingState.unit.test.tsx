import {AbiItem} from 'web3-utils/types';
import {renderHook, act} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {ProposalVotingAdapterData, ProposalVotingAdapterTuple} from '../types';
import {useProposalsVotingState} from './useProposalsVotingState';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import Wrapper from '../../../test/Wrapper';

describe('useProposalsVotingState unit tests', () => {
  /**
   * `useProposalsVotingState` uses the `IVoting` contract interally,
   * so we don't need to be concerned about setting an ABI in the test data.
   * We just need to make sure we can pass different addresses for `votingAdapterAddress`.
   */
  const defaultVotingAdapterData: ProposalVotingAdapterData = {
    votingAdapterAddress: DEFAULT_ETH_ADDRESS,
    votingAdapterName: VotingAdapterName.OffchainVotingContract,
    getVotingAdapterABI: () => [] as AbiItem[],
    getWeb3VotingAdapterContract: () => undefined as any,
  };

  test('should return correct hook state', async () => {
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      [DEFAULT_PROPOSAL_HASH, defaultVotingAdapterData],
      [DEFAULT_PROPOSAL_HASH, defaultVotingAdapterData],
      // Set another voting adapter address to be safe
      [
        DEFAULT_PROPOSAL_HASH,
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0xa8ED02b24B4E9912e39337322885b65b23CdF188',
        },
      ],
    ];

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useProposalsVotingState(proposalsVotingAdapterTuples),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

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

      await waitForValueToChange(
        () => result.current.proposalsVotingStateStatus
      );

      // Assert pending state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.PENDING
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForValueToChange(
        () => result.current.proposalsVotingStateStatus
      );

      // Assert fulfilled state
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.FULFILLED
      );
      expect(result.current.proposalsVotingState).toMatchObject([
        [DEFAULT_PROPOSAL_HASH, '0'],
        [DEFAULT_PROPOSAL_HASH, '2'],
        [DEFAULT_PROPOSAL_HASH, '3'],
      ]);
    });
  });

  test('should return empty result if every proposalIds is not bytes32[]', async () => {
    const badProposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      ['abc123', defaultVotingAdapterData],
      ['abc456', defaultVotingAdapterData],
      // Set another voting adapter address to be safe
      [
        'abc789',
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0xa8ED02b24B4E9912e39337322885b65b23CdF188',
        },
      ],
    ];

    const {result, waitForValueToChange} = renderHook(
      () => useProposalsVotingState(badProposalsVotingAdapterTuples),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForValueToChange(
        () => result.current.proposalsVotingStateStatus
      );

      // Assert fulfilled state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.FULFILLED
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);
    });
  });

  test('should return correct hook state if only some proposalIds is bytes32[]', async () => {
    const badProposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      [DEFAULT_PROPOSAL_HASH, defaultVotingAdapterData],
      ['abc456', defaultVotingAdapterData],
      // Set another voting adapter address to be safe
      [
        'abc789',
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0xa8ED02b24B4E9912e39337322885b65b23CdF188',
        },
      ],
    ];

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    const {result, waitForValueToChange} = renderHook(
      () => useProposalsVotingState(badProposalsVotingAdapterTuples),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
          getProps: (p) => {
            mockWeb3Provider = p.mockWeb3Provider;
            web3Instance = p.web3Instance;
          },
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

      // Mock proposals' voting state multicall response
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // VotingState.PASS
              web3Instance.eth.abi.encodeParameter('uint8', '2'),
            ],
          ]
        )
      );

      await waitForValueToChange(
        () => result.current.proposalsVotingStateStatus
      );

      // Assert pending state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.PENDING
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForValueToChange(
        () => result.current.proposalsVotingStateStatus
      );

      // Assert fulfilled state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.FULFILLED
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([
        [DEFAULT_PROPOSAL_HASH, '2'],
      ]);
    });
  });

  test('should not run if empty array of proposalIds', async () => {
    const emptyProposalsVotingAdapterTuples =
      [] as ProposalVotingAdapterTuple[];

    const {result, waitForNextUpdate} = renderHook(
      () => useProposalsVotingState(emptyProposalsVotingAdapterTuples),
      {
        wrapper: Wrapper,
        initialProps: {
          useInit: true,
          useWallet: true,
        },
      }
    );

    await act(async () => {
      // Assert initial state
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);

      await waitForNextUpdate();

      // Assert no changes
      expect(result.current.proposalsVotingStateStatus).toBe(
        AsyncStatus.STANDBY
      );
      expect(result.current.proposalsVotingStateError).toBe(undefined);
      expect(result.current.proposalsVotingState).toMatchObject([]);
    });
  });
});
