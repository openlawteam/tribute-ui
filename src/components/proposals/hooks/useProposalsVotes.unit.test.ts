import {AbiItem} from 'web3-utils/types';
import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  FakeHttpProvider,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {ProposalVotingAdapterData, ProposalVotingAdapterTuple} from '../types';
import {useProposalsVotes} from './useProposalsVotes';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import OffchainVotingABI from '../../../abis/OffchainVotingContract.json';
import VotingABI from '../../../abis/VotingContract.json';
import Wrapper from '../../../test/Wrapper';

describe('useProposalsVotes unit tests', () => {
  const defaultVotingAdapterData: ProposalVotingAdapterData = {
    votingAdapterAddress: DEFAULT_ETH_ADDRESS,
    votingAdapterName: VotingAdapterName.OffchainVotingContract,
    getVotingAdapterABI: () => OffchainVotingABI as AbiItem[],
    getWeb3VotingAdapterContract: () => undefined as any,
  };

  test('should return correct data when OK', async () => {
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      [DEFAULT_PROPOSAL_HASH, defaultVotingAdapterData],
      // Set data other than the default to test multiple results
      [
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca76',
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        },
      ],
      // Set data other than the default to test multiple results
      [
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca77',
        {
          ...defaultVotingAdapterData,
          votingAdapterName: VotingAdapterName.VotingContract,
          votingAdapterAddress: '0xa8ED02b24B4E9912e39337322885b65b23CdF188',
          getVotingAdapterABI: () => VotingABI as AbiItem[],
        },
      ],
    ];

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalsVotes(proposalsVotingAdapterTuples),
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

      const offchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
        {
          Voting: {
            snapshot: 'uint256',
            reporter: 'address',
            resultRoot: 'bytes32',
            nbYes: 'uint256',
            nbNo: 'uint256',
            startingTime: 'uint256',
            gracePeriodStartingTime: 'uint256',
            forceFailed: 'bool',
            isChallenged: 'bool',
            fallbackVotesCount: 'uint256',
          },
        },
        {
          snapshot: '8376297',
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          nbYes: '1',
          nbNo: '0',
          startingTime: '1617878162',
          gracePeriodStartingTime: '1617964640',
          forceFailed: false,
          isChallenged: false,
          fallbackVotesCount: '0',
        }
      );

      const onchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
        {
          Voting: {
            nbYes: 'uint256',
            nbNo: 'uint256',
            startingTime: 'uint256',
            blockNumber: 'uint256',
          },
        },
        {
          blockNumber: '10',
          nbNo: '50',
          nbYes: '100',
          startingTime: '1617878162',
        }
      );

      // Assert initial state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Mock votes data responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              offchainVotesDataResponse,
              offchainVotesDataResponse,
              onchainVotesDataResponse,
            ],
          ]
        )
      );

      // Assert pending state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Assert fulfilled state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([
        [
          DEFAULT_PROPOSAL_HASH,
          {
            OffchainVotingContract: {
              '0': '8376297',
              '1': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              '2': '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              '3': '1',
              '4': '0',
              '5': '1617878162',
              '6': '1617964640',
              '7': false,
              '8': false,
              '9': '0',
              __length__: 10,
              snapshot: '8376297',
              reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              resultRoot:
                '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              nbYes: '1',
              nbNo: '0',
              startingTime: '1617878162',
              gracePeriodStartingTime: '1617964640',
              forceFailed: false,
              isChallenged: false,
              fallbackVotesCount: '0',
            },
          },
        ],
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca76',
          {
            OffchainVotingContract: {
              '0': '8376297',
              '1': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              '2': '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              '3': '1',
              '4': '0',
              '5': '1617878162',
              '6': '1617964640',
              '7': false,
              '8': false,
              '9': '0',
              __length__: 10,
              snapshot: '8376297',
              reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              resultRoot:
                '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              nbYes: '1',
              nbNo: '0',
              startingTime: '1617878162',
              gracePeriodStartingTime: '1617964640',
              forceFailed: false,
              isChallenged: false,
              fallbackVotesCount: '0',
            },
          },
        ],
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca77',
          {
            VotingContract: {
              '0': '100',
              '1': '50',
              '2': '1617878162',
              '3': '10',
              __length__: 4,
              blockNumber: '10',
              nbNo: '50',
              nbYes: '100',
              startingTime: '1617878162',
            },
          },
        ],
      ]);
    });
  });

  test('should return error on bad voting adapter name', async () => {
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      [
        '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca76',
        {
          ...defaultVotingAdapterData,
          votingAdapterName: 'BadVotingAdapterName' as VotingAdapterName,
          votingAdapterAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        },
      ],
    ];

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalsVotes(proposalsVotingAdapterTuples),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Assert pending state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Assert rejected state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.REJECTED);
      expect(result.current.proposalsVotesError?.message).toMatch(
        /no voting adapter name was found for "badvotingadaptername"/i
      );
      expect(result.current.proposalsVotes).toMatchObject([]);
    });
  });

  test('should only return data for hex proposal ids', async () => {
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      ['badId-abc123', defaultVotingAdapterData],
      // Set data other than the default to test multiple results
      [
        DEFAULT_PROPOSAL_HASH,
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        },
      ],
    ];

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalsVotes(proposalsVotingAdapterTuples),
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

      const offchainVotesDataResponse = web3Instance.eth.abi.encodeParameter(
        {
          Voting: {
            snapshot: 'uint256',
            reporter: 'address',
            resultRoot: 'bytes32',
            nbYes: 'uint256',
            nbNo: 'uint256',
            startingTime: 'uint256',
            gracePeriodStartingTime: 'uint256',
            forceFailed: 'bool',
            isChallenged: 'bool',
            fallbackVotesCount: 'uint256',
          },
        },
        {
          snapshot: '8376297',
          reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
          resultRoot:
            '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
          nbYes: '1',
          nbNo: '0',
          startingTime: '1617878162',
          gracePeriodStartingTime: '1617964640',
          forceFailed: false,
          isChallenged: false,
          fallbackVotesCount: '0',
        }
      );

      // Assert initial state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Mock votes data responses
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [0, [offchainVotesDataResponse]]
        )
      );

      // Assert pending state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Assert fulfilled state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([
        [
          '0x4662dd46b8ca7ce0852426f20bc53b02335432089bbe3a4c510b36741d81ca75',
          {
            OffchainVotingContract: {
              '0': '8376297',
              '1': '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              '2': '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              '3': '1',
              '4': '0',
              '5': '1617878162',
              '6': '1617964640',
              '7': false,
              '8': false,
              '9': '0',
              __length__: 10,
              snapshot: '8376297',
              reporter: '0xf9731Ad60BeCA05E9FB7aE8Dd4B63BFA49675b68',
              resultRoot:
                '0x9298a7fccdf7655408a8106ff03c9cbf0610082cc0f00dfe4c8f73f57a60df71',
              nbYes: '1',
              nbNo: '0',
              startingTime: '1617878162',
              gracePeriodStartingTime: '1617964640',
              forceFailed: false,
              isChallenged: false,
              fallbackVotesCount: '0',
            },
          },
        ],
      ]);
    });
  });

  test('should return correct data when no bytes32[] proposal ids', async () => {
    // Internal filtering should cause the resulting array to be empty.
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [
      ['bad', defaultVotingAdapterData],
      [
        'bad-one',
        {
          ...defaultVotingAdapterData,
          votingAdapterAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        },
      ],
    ];

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useProposalsVotes(proposalsVotingAdapterTuples),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForValueToChange(() => result.current.proposalsVotesStatus);

      // Assert fulfilled state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.FULFILLED);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);
    });
  });

  test('should not start when no proposal ids', async () => {
    // Internal filtering will cause the resulting array to be empty.
    const proposalsVotingAdapterTuples: ProposalVotingAdapterTuple[] = [];

    await act(async () => {
      const {result, waitForNextUpdate} = await renderHook(
        () => useProposalsVotes(proposalsVotingAdapterTuples),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial state
      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);

      await waitForNextUpdate();

      expect(result.current.proposalsVotesStatus).toBe(AsyncStatus.STANDBY);
      expect(result.current.proposalsVotesError).toBe(undefined);
      expect(result.current.proposalsVotes).toMatchObject([]);
    });
  });
});
