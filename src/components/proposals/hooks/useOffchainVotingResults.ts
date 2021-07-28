import {AbiItem} from 'web3-utils/types';
import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {VoteChoicesIndex} from '@openlaw/snapshot-js-erc712';
import Web3 from 'web3';
import {useQueryClient} from 'react-query';

import {AsyncStatus} from '../../../util/types';
import {multicall, MulticallTuple} from '../../web3/helpers';
import {SnapshotProposal, VotingResult} from '../types';
import {StoreState} from '../../../store/types';
import {UNITS_ADDRESS, TOTAL_ADDRESS} from '../../../config';
import {useIsMounted} from '../../../hooks';
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

  const [votingResults, setVotingResults] =
    useState<OffchainVotingResultEntries>([]);

  const [offchainVotingResultsStatus, setOffchainVotingResultsStatus] =
    useState<AsyncStatus>(AsyncStatus.STANDBY);

  const [offchainVotingResultsError, setOffchainVotingResultsError] = useState<
    Error | undefined
  >();

  /**
   * Our hooks
   */

  const {web3Instance} = useWeb3Modal();
  const {isMountedRef} = useIsMounted();

  /**
   * Their hooks
   */

  const queryClient = useQueryClient();

  /**
   * Variables
   */

  const getPriorAmountABI = bankABI?.find(
    (item) => item.name === 'getPriorAmount'
  );

  /**
   * Cached callbacks
   */

  const getUnitsPerChoiceCached = useCallback(getUnitsPerChoiceFromContract, [
    queryClient,
  ]);

  const buildOffchainVotingResultEntriesCached = useCallback(
    buildOffchainVotingResultEntries,
    [
      bankAddress,
      getPriorAmountABI,
      getUnitsPerChoiceCached,
      isMountedRef,
      proposals,
      queryClient,
      web3Instance,
    ]
  );

  /**
   * Effects
   */

  // Build result entries of `OffchainVotingResultEntries`
  useEffect(() => {
    buildOffchainVotingResultEntriesCached();
  }, [buildOffchainVotingResultEntriesCached]);

  /**
   * Functions
   */

  async function buildOffchainVotingResultEntries() {
    const proposalsToMap = Array.isArray(proposals) ? proposals : [proposals];

    if (
      !bankAddress ||
      !getPriorAmountABI ||
      !proposalsToMap.length ||
      !web3Instance
    ) {
      return;
    }

    setOffchainVotingResultsStatus(AsyncStatus.PENDING);

    // const votingResultPromises = proposalsToMap.map(async (p) => {
    //   const snapshot = p?.msg.payload.snapshot;
    //   const idInSnapshot = p?.idInSnapshot;

    //   if (!idInSnapshot || !snapshot) return;

    //   const voterEntries = p?.votes?.map((v): [string, number] => {
    //     const vote = v[Object.keys(v)[0]];

    //     return [
    //       /**
    //        * Must be the true member's address for calculating voting power.
    //        * This value is (or at least should be) derived from `OffchainVoting.memberAddressesByDelegatedKey`.
    //        */
    //       vote.msg.payload.metadata.memberAddress,
    //       vote.msg.payload.choice,
    //     ];
    //   });

    //   if (!voterEntries) return;

    //   // Dedupe any duplicate addresses to be safe.
    //   const voterAddressesAndChoices = Object.entries(
    //     Object.fromEntries(voterEntries)
    //   );

    //   try {
    //     const result = await getUnitsPerChoiceCached({
    //       bankAddress,
    //       getPriorAmountABI,
    //       snapshot,
    //       voterAddressesAndChoices,
    //       web3Instance,
    //     });

    //     return [idInSnapshot, result];
    //   } catch (error) {
    //     return;
    //   }
    // });

    try {
      const votingResultsToSet: OffchainVotingResultEntries =
        await queryClient.fetchQuery(
          ['votingResultsToSet', proposalsToMap],
          async () =>
            await Promise.all(
              proposalsToMap.map(async (p) => {
                const snapshot = p?.msg.payload.snapshot;
                const idInSnapshot = p?.idInSnapshot;

                if (!idInSnapshot || !snapshot) return;

                const voterEntries = p?.votes?.map((v): [string, number] => {
                  const vote = v[Object.keys(v)[0]];

                  return [
                    /**
                     * Must be the true member's address for calculating voting power.
                     * This value is (or at least should be) derived from `OffchainVoting.memberAddressesByDelegatedKey`.
                     */
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
                  const result = await getUnitsPerChoiceCached({
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
              })
            ).then((p) => p.filter((p) => p) as OffchainVotingResultEntries),
          {
            staleTime: 60000,
          }
        );

      if (!isMountedRef.current) return;

      setOffchainVotingResultsStatus(AsyncStatus.FULFILLED);
      setVotingResults(votingResultsToSet);
      setOffchainVotingResultsError(undefined);
    } catch (error) {
      if (!isMountedRef.current) return;

      setOffchainVotingResultsStatus(AsyncStatus.REJECTED);
      setVotingResults([]);
      setOffchainVotingResultsError(error);
    }

    // Promise.all(votingResultPromises)
    //   .then((p) => p.filter((p) => p) as OffchainVotingResultEntries)
    //   .then((r) => {
    //     if (!isMountedRef.current) return;

    //     setOffchainVotingResultsStatus(AsyncStatus.FULFILLED);
    //     setVotingResults(r);
    //     setOffchainVotingResultsError(undefined);
    //   })
    //   .catch((error) => {
    //     if (!isMountedRef.current) return;

    //     setOffchainVotingResultsStatus(AsyncStatus.REJECTED);
    //     setVotingResults([]);
    //     setOffchainVotingResultsError(error);
    //   });
  }

  async function getUnitsPerChoiceFromContract({
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
          units: 0,
        },
        [VoteChoices.No]: {
          percentage: 0,
          units: 0,
        },
        totalUnits: 0,
      };

      // Build a call for total units
      const totalUnitsCall: MulticallTuple = [
        bankAddress,
        getPriorAmountABI,
        [
          TOTAL_ADDRESS, // account
          UNITS_ADDRESS, // tokenAddr
          snapshot.toString(), // blockNumber
        ],
      ];

      // Build calls to Bank contract
      const unitsCalls = voterAddressesAndChoices.map(
        ([address]): MulticallTuple => [
          bankAddress,
          getPriorAmountABI,
          [
            address, // account
            UNITS_ADDRESS, // tokenAddr
            snapshot.toString(), // blockNumber
          ],
        ]
      );

      const calls = [totalUnitsCall, ...unitsCalls];

      const [totalUnitsResult, ...votingResults]: string[] =
        await queryClient.fetchQuery(
          ['totalUnitsResultAndVotingResults', calls],
          async () => await multicall({calls: calls, web3Instance}),
          {
            staleTime: 60000,
          }
        );

      // Set Units values for choices
      votingResults.forEach((units, i) => {
        const isYes =
          VoteChoicesIndex[voterAddressesAndChoices[i][1]] ===
          VoteChoicesIndex[VoteChoicesIndex.Yes];
        const choice = isYes ? VoteChoices.Yes : VoteChoices.No;

        results[choice].units += Number(units);
      });

      // Set percentages
      results[VoteChoices.Yes].percentage =
        (results[VoteChoices.Yes].units / Number(totalUnitsResult)) * 100;

      results[VoteChoices.No].percentage =
        (results[VoteChoices.No].units / Number(totalUnitsResult)) * 100;

      // Set total units
      results.totalUnits = Number(totalUnitsResult);

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
