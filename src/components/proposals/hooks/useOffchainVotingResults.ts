import {VoteChoicesIndex} from '@openlaw/snapshot-js-erc712';
import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {multicall, MulticallTuple} from '../../web3/helpers';
import {ProposalData} from '../types';
import {SHARES_ADDRESS, TOTAL_ADDRESS} from '../../../config';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks';
import {VoteChoices} from '../../web3/types';

type VoteChoiceResult = {
  percentage: number;
  shares: number;
};

type OffchainVotingResult = {
  [VoteChoices.Yes]: VoteChoiceResult;
  [VoteChoices.No]: VoteChoiceResult;
  totalShares: number;
};

/**
 * @todo Attempt to use subgraph data first.
 */
export function useOffchainVotingResults(
  proposal: ProposalData
): OffchainVotingResult | undefined {
  const {snapshotProposal} = proposal;
  const votes = snapshotProposal?.votes;
  const snapshot = snapshotProposal?.msg.payload.snapshot;

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

  const [voterAddressesAndChoices, setVoterAddressesAndChoices] = useState<
    [string, number][]
  >();
  const [sharesResults, setSharesResults] = useState<OffchainVotingResult>();

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

  const getSharesPerChoiceCached = useCallback(getSharesPerChoiceFromContract, [
    bankAddress,
    getPriorAmountABI,
    snapshot,
    voterAddressesAndChoices,
    web3Instance,
  ]);

  /**
   * Effects
   */

  // Collect voter addresses
  useEffect(() => {
    if (!votes) return;

    const voterEntries = votes.map((v) => {
      const vote = v[Object.keys(v)[0]];

      return [vote.msg.payload.metadata.memberAddress, vote.msg.payload.choice];
    });

    setVoterAddressesAndChoices(
      // Dedupe any duplicate addresses to be safe.
      Object.entries(Object.fromEntries(voterEntries))
    );
  }, [votes]);

  useEffect(() => {
    // @todo If subgraph active, then exit.

    getSharesPerChoiceCached();
  }, [getSharesPerChoiceCached]);

  /**
   * Functions
   */

  async function getSharesPerChoiceFromContract() {
    try {
      if (!bankAddress || !getPriorAmountABI || !voterAddressesAndChoices)
        return;

      if (!snapshot) {
        throw new Error('No snapshot was found.');
      }

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

      const [totalSharesResult, ...sharesResults]: string[] = await multicall({
        calls,
        web3Instance,
      });

      // Set shares values for choices
      sharesResults.forEach((shares, i) => {
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

      setSharesResults((prevState) => ({
        ...prevState,
        ...results,
      }));
    } catch (error) {
      setSharesResults(undefined);
    }
  }

  return sharesResults;
}
