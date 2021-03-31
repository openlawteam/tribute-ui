import {AbiItem} from 'web3-utils/types';
import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {VoteChoicesIndex} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {SHARES_ADDRESS, TOTAL_ADDRESS} from '../../../config';
import {SnapshotProposal, VotingResult} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VoteChoices} from '../../web3/types';

type OffchainVotingResultEntries = [
  proposalHash: string,
  votingResult: VotingResult
][];

type UseOffchainVotingResultsReturn = {
  offchainVotingResults: OffchainVotingResultEntries;
  offchainVotingResultsError: Error | undefined;
  offchainVotingResultsStatus: AsyncStatus;
};

/**
 * @todo Polling
 * @todo Attempt to use subgraph data first.
 */
export function useOffchainVotingResults(
  /**
   * Accepts a single `SnapshotProposal` or `SnapshotProposal[]`
   */
  proposals: (SnapshotProposal | undefined) | (SnapshotProposal | undefined)[]
): UseOffchainVotingResultsReturn {
  /**
   * Selectors
   */

  const bankABI = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.abi
  );
  const bankAddress = useSelector(
    (s: StoreState) => s.contracts.BankExtensionContract?.contractAddress
  );

  /**
   * State
   */

  const [
    votingResults,
    setVotingResults,
  ] = useState<OffchainVotingResultEntries>([]);

  const [
    offchainVotingResultsStatus,
    setOffchainVotingResultsStatus,
  ] = useState<AsyncStatus>(AsyncStatus.STANDBY);

  const [offchainVotingResultsError, setOffchainVotingResultsError] = useState<
    Error | undefined
  >();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();

  /**
   * Variables
   */

  const getPriorAmountABI = bankABI?.find(
    (item) => item.name === 'getPriorAmount'
  );

  /**
   * Cached callbacks
   */

  const getSharesPerChoiceCached = useCallback(
    getSharesPerChoiceFromContract,
    []
  );

  /**
   * Effects
   */

  // Build result entries of `OffchainVotingResultEntries`
  useEffect(() => {
    const proposalsToMap = Array.isArray(proposals) ? proposals : [proposals];

    if (!bankAddress || !getPriorAmountABI || !proposalsToMap.length) {
      return;
    }

    setOffchainVotingResultsStatus(AsyncStatus.PENDING);

    const votingResultPromises = proposalsToMap.map(async (p) => {
      const snapshot = p?.msg.payload.snapshot;
      const idInSnapshot = p?.idInSnapshot;

      if (!idInSnapshot || !snapshot) return;

      const voterEntries = p?.votes?.map((v): [string, number] => {
        const vote = v[Object.keys(v)[0]];

        return [
          vote.msg.payload.metadata.memberAddress,
          vote.msg.payload.choice,
        ];
      });

      if (!voterEntries) return;

      // Dedupe any duplicate addresses to be safe.
      const voterAddressesAndChoices = Object.entries(
        Object.fromEntries(voterEntries)
      );

      try {
        const result = await getSharesPerChoiceCached({
          bankAddress,
          getPriorAmountABI,
          snapshot,
          voterAddressesAndChoices,
          web3Instance,
        });

        return [idInSnapshot, result];
      } catch (error) {
        return;
      }
    });

    Promise.all(votingResultPromises)
      .then((p) => p.filter((p) => p) as OffchainVotingResultEntries)
      .then((r) => {
        setOffchainVotingResultsStatus(AsyncStatus.FULFILLED);
        setVotingResults(r);
        setOffchainVotingResultsError(undefined);
      })
      .catch((error) => {
        setOffchainVotingResultsStatus(AsyncStatus.REJECTED);
        setVotingResults([]);
        setOffchainVotingResultsError(error);
      });
  }, [
    bankAddress,
    getPriorAmountABI,
    getSharesPerChoiceCached,
    proposals,
    web3Instance,
  ]);

  /**
   * Functions
   */

  async function getSharesPerChoiceFromContract({
    bankAddress,
    getPriorAmountABI,
    snapshot,
    voterAddressesAndChoices,
    web3Instance,
  }: {
    bankAddress: string;
    getPriorAmountABI: AbiItem;
    snapshot: number;
    voterAddressesAndChoices: [string, number][];
    web3Instance: Web3;
  }): Promise<VotingResult> {
    try {
      // Create results object to set later
      const results = {
        [VoteChoices.Yes]: {
          percentage: 0,
          shares: 0,
        },
        [VoteChoices.No]: {
          percentage: 0,
          shares: 0,
        },
        totalShares: 0,
      };

      // Build a call for total shares
      const totalSharesCall: MulticallTuple = [
        bankAddress,
        getPriorAmountABI,
        [
          TOTAL_ADDRESS, // account
          SHARES_ADDRESS, // tokenAddr
          snapshot.toString(), // blockNumber
        ],
      ];

      // Build calls to Bank contract
      const sharesCalls = voterAddressesAndChoices.map(
        ([address]): MulticallTuple => [
          bankAddress,
          getPriorAmountABI,
          [
            address, // account
            SHARES_ADDRESS, // tokenAddr
            snapshot.toString(), // blockNumber
          ],
        ]
      );

      const calls = [totalSharesCall, ...sharesCalls];

      const [totalSharesResult, ...votingResults]: string[] = await multicall({
        calls,
        web3Instance,
      });

      // Set shares values for choices
      votingResults.forEach((shares, i) => {
        const isYes =
          VoteChoicesIndex[voterAddressesAndChoices[i][1]] ===
          VoteChoicesIndex[VoteChoicesIndex.Yes];
        const choice = isYes ? VoteChoices.Yes : VoteChoices.No;

        results[choice].shares += Number(shares);
      });

      // Set percentages
      results[VoteChoices.Yes].percentage =
        (results[VoteChoices.Yes].shares / Number(totalSharesResult)) * 100;

      results[VoteChoices.No].percentage =
        (results[VoteChoices.No].shares / Number(totalSharesResult)) * 100;

      // Set total shares
      results.totalShares = Number(totalSharesResult);

      return results;
    } catch (error) {
      throw error;
    }
  }

  return {
    offchainVotingResults: votingResults,
    offchainVotingResultsError,
    offchainVotingResultsStatus,
  };
}
