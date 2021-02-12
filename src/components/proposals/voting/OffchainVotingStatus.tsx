import {useEffect, useState} from 'react';

import {ProposalData} from '../types';
import {useOffchainVotingStartEnd} from '../hooks';
import {VotingStatus} from './VotingStatus';

type OffchainVotingStatusProps = {
  proposal: ProposalData;
  showPercentages?: boolean;
};

/**
 * OffchainVotingStatus
 *
 * A read-only component to show voting status information.
 *
 * @param {OffchainVotingStatusProps} props
 * @returns {JSX.Element}
 */
export function OffchainVotingStatus({
  proposal,
}: OffchainVotingStatusProps): JSX.Element {
  const {snapshotProposal} = proposal;

  /**
   * State
   */

  const [didVotePass, setDidVotePass] = useState<boolean>();

  /**
   * Variables
   */

  const votingStartSeconds = snapshotProposal?.msg.payload.start || 0;
  const votingEndSeconds = snapshotProposal?.msg.payload.end || 0;
  // @todo Add function to calculate member voting power by shares
  const yesShares = 0;
  const noShares = 0;
  const totalShares = 10000000;

  /**
   * Our hooks
   */

  const {
    hasOffchainVotingStarted,
    hasOffchainVotingEnded,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  /**
   * Effects
   */

  useEffect(() => {
    if (!hasOffchainVotingEnded) return;

    setDidVotePass(yesShares > noShares);
  }, [hasOffchainVotingEnded]);

  /**
   * Functions
   */

  function renderStatus() {
    // On loading
    if (!offchainVotingStartEndInitReady) {
      return '\u2026'; // ...
    }

    // @todo On grace period start

    // On voting ended
    if (typeof didVotePass === 'boolean') {
      return didVotePass ? 'Approved' : 'Failed';
    }
  }

  function renderTimer(
    ProposalPeriodComponent: Parameters<
      Parameters<typeof VotingStatus>[0]['renderTimer']
    >[0]
  ) {
    if (
      offchainVotingStartEndInitReady &&
      hasOffchainVotingStarted &&
      !hasOffchainVotingEnded
    ) {
      return (
        <ProposalPeriodComponent
          startPeriodMs={votingStartSeconds * 1000}
          endPeriodMs={votingEndSeconds * 1000}
        />
      );
    }
  }

  /**
   * Render
   */

  return (
    <VotingStatus
      renderTimer={renderTimer}
      renderStatus={renderStatus}
      hasVotingEnded={hasOffchainVotingEnded}
      noShares={noShares}
      totalShares={totalShares}
      yesShares={yesShares}
    />
  );
}
