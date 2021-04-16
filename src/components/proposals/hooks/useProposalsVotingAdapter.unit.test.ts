import {act, renderHook} from '@testing-library/react-hooks';

import {AsyncStatus} from '../../../util/types';
import {DEFAULT_ETH_ADDRESS} from '../../../test/helpers';
import {useProposalsVotingAdapter} from './useProposalsVotingAdapter';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import OffchainVotingContractABI from '../../../truffle-contracts/OffchainVotingContract.json';
import VotingContractABI from '../../../truffle-contracts/VotingContract.json';
import Wrapper from '../../../test/Wrapper';

describe('useProposalsVotingAdapter unit tests', () => {
  test('should return correct data', async () => {
    await act(async () => {
      const proposalIds = [
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca76',
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca77',
      ];

      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingAdapter(proposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              );
              const votingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                '0xa8ED02b24B4E9912e39337322885b65b23CdF188'
              );

              const offchainVotingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.OffchainVotingContract
              );

              const votingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.VotingContract
              );

              // Mock `dao.votingAdapter` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterResponse,
                      offchainVotingAdapterResponse,
                      votingAdapterResponse,
                    ],
                  ]
                )
              );

              // Mock `IVoting.getAdapterName` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterNameResponse,
                      offchainVotingAdapterNameResponse,
                      votingAdapterNameResponse,
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Initial state
      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.PENDING
      );

      await waitForNextUpdate();

      // Assert first tuple result

      expect(result.current.proposalsVotingAdapters[0][0]).toBe(proposalIds[0]);

      expect(
        result.current.proposalsVotingAdapters[0][1].votingAdapterABI
      ).toMatchObject(OffchainVotingContractABI);

      expect(
        result.current.proposalsVotingAdapters[0][1].votingAdapterAddress
      ).toBe(DEFAULT_ETH_ADDRESS);

      expect(
        result.current.proposalsVotingAdapters[0][1].votingAdapterName
      ).toBe(VotingAdapterName.OffchainVotingContract);

      expect(
        result.current.proposalsVotingAdapters[0][1]
          .getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);

      // Assert second tuple result

      expect(result.current.proposalsVotingAdapters[1][0]).toBe(proposalIds[1]);

      expect(
        result.current.proposalsVotingAdapters[1][1].votingAdapterABI
      ).toMatchObject(OffchainVotingContractABI);

      expect(
        result.current.proposalsVotingAdapters[1][1].votingAdapterAddress
      ).toBe(DEFAULT_ETH_ADDRESS);

      expect(
        result.current.proposalsVotingAdapters[1][1].votingAdapterName
      ).toBe(VotingAdapterName.OffchainVotingContract);

      expect(
        result.current.proposalsVotingAdapters[1][1]
          .getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);

      // Assert third tuple result

      expect(result.current.proposalsVotingAdapters[2][0]).toBe(proposalIds[2]);

      expect(
        result.current.proposalsVotingAdapters[2][1].votingAdapterABI
      ).toMatchObject(VotingContractABI);

      expect(
        result.current.proposalsVotingAdapters[2][1].votingAdapterAddress
      ).toBe('0xa8ED02b24B4E9912e39337322885b65b23CdF188');

      expect(
        result.current.proposalsVotingAdapters[2][1].votingAdapterName
      ).toBe(VotingAdapterName.VotingContract);

      expect(
        result.current.proposalsVotingAdapters[2][1]
          .getWeb3VotingAdapterContract
      ).toBeInstanceOf(Function);

      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.FULFILLED
      );

      // Test off-chain `getWeb3VotingAdapterContract` function return result

      expect(
        result.current.proposalsVotingAdapters[0][1].getWeb3VotingAdapterContract()
          .methods.submitVoteResult
      ).toBeDefined();

      // Test on-chain `getWeb3VotingAdapterContract` function return result

      expect(
        result.current.proposalsVotingAdapters[2][1].getWeb3VotingAdapterContract()
          .methods.submitVote
      ).toBeDefined();
    });
  });

  test('should not start when no proposal ids', async () => {
    await act(async () => {
      const proposalIds = [] as string[];

      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingAdapter(proposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              );
              const votingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                '0xa8ED02b24B4E9912e39337322885b65b23CdF188'
              );

              const offchainVotingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.OffchainVotingContract
              );

              const votingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.VotingContract
              );

              // Mock `dao.votingAdapter` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterResponse,
                      offchainVotingAdapterResponse,
                      votingAdapterResponse,
                    ],
                  ]
                )
              );

              // Mock `IVoting.getAdapterName` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterNameResponse,
                      offchainVotingAdapterNameResponse,
                      votingAdapterNameResponse,
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Initial state
      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.STANDBY
      );
    });
  });

  test('should return no data when no bytes32[] proposal ids', async () => {
    await act(async () => {
      const proposalIds = ['bad id', 'another bad', 'totally bad'];

      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotingAdapter(proposalIds),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: ({mockWeb3Provider, web3Instance}) => {
              const offchainVotingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                DEFAULT_ETH_ADDRESS
              );
              const votingAdapterResponse = web3Instance.eth.abi.encodeParameter(
                'address',
                '0xa8ED02b24B4E9912e39337322885b65b23CdF188'
              );

              const offchainVotingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.OffchainVotingContract
              );

              const votingAdapterNameResponse = web3Instance.eth.abi.encodeParameter(
                'string',
                VotingAdapterName.VotingContract
              );

              // Mock `dao.votingAdapter` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterResponse,
                      offchainVotingAdapterResponse,
                      votingAdapterResponse,
                    ],
                  ]
                )
              );

              // Mock `IVoting.getAdapterName` responses
              mockWeb3Provider.injectResult(
                web3Instance.eth.abi.encodeParameters(
                  ['uint256', 'bytes[]'],
                  [
                    0,
                    [
                      offchainVotingAdapterNameResponse,
                      offchainVotingAdapterNameResponse,
                      votingAdapterNameResponse,
                    ],
                  ]
                )
              );
            },
          },
        }
      );

      // Initial state
      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.STANDBY
      );

      await waitForNextUpdate();

      expect(result.current.proposalsVotingAdapters).toMatchObject([]);
      expect(result.current.proposalsVotingAdaptersError).toBe(undefined);
      expect(result.current.proposalsVotingAdaptersStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });
  });
});
