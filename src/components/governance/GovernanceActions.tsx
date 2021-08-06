import {useCallback, useState} from 'react';

import {
  OffchainVotingAction,
  OffchainVotingStatus,
  OnVotingPeriodChangeProps,
} from '../proposals/voting';
import {ProposalData} from '../proposals/types';
import {useOffchainVotingResults} from '../proposals/hooks';

type GovernanceActionsProps = {
  proposal: ProposalData;
};

export function GovernanceActions(props: GovernanceActionsProps) {
  const {proposal} = props;
  const {snapshotProposal} = proposal;

  const votingStartMs: number | undefined =
    Number(snapshotProposal?.msg.payload.start || 0) * 1000;

  const votingEndMs: number =
    Number(snapshotProposal?.msg.payload.end || 0) * 1000;

  /**
   * State
   */

  const [votingPeriodData, setVotingPeriodData] =
    useState<OnVotingPeriodChangeProps>({
      hasVotingStarted: false,
      hasVotingEnded: false,
      votingStartEndInitReady: false,
    });

  /**
   * Our hooks
   */

  const {offchainVotingResults} = useOffchainVotingResults(snapshotProposal);

  /**
   * Cached callbacks
   */

  const handleOnVotingPeriodChangeCached = useCallback(
    handleOnVotingPeriodChange,
    []
  );

  /**
   * Variables
   */

  const votingResult = offchainVotingResults[0]?.[1];

  const {hasVotingEnded, hasVotingStarted, votingStartEndInitReady} =
    votingPeriodData;

  /**
   * Functions
   */

  function handleOnVotingPeriodChange(
    votingPeriodProps: OnVotingPeriodChangeProps
  ) {
    setVotingPeriodData(votingPeriodProps);
  }

  /**
   * Render
   */

  return (
    <>
      <OffchainVotingStatus
        countdownVotingEndMs={votingEndMs}
        countdownVotingStartMs={votingStartMs}
        onVotingPeriodChange={handleOnVotingPeriodChangeCached}
        votingResult={votingResult}
      />

      {votingStartEndInitReady && hasVotingStarted && !hasVotingEnded && (
        <OffchainVotingAction proposal={proposal} />
      )}
    </>
  );
}
