import {useEffect, useState} from 'react';

import {ContractDAOConfigKeys} from '../../web3/types';
import {CycleEllipsis} from '../../feedback';
import {getDAOConfigEntry} from '../../web3/helpers';
import {ProposalData} from '../types';
import {StoreState} from '../../../store/types';
import {useOffchainVotingStartEnd} from '../hooks';
import {useSelector} from 'react-redux';
import {VotingStatus} from './VotingStatus';

type OffchainVotingStatusProps = {
  /**
   * When the offchain grace period seconds are provided the grace period timer
   * will display. The end seconds will be determined inside the component.
   *
   * Be sure to unset this value (`0`, `undefined`) if the grace period should not show.
   */
  countdownGracePeriodStartMs?: number;
  proposal: ProposalData;
  showPercentages?: boolean;
};

// Cached grace period label
const gracePeriodEndLabel = (
  <span>
    Grace period ends:
    <br />
  </span>
);

// Cached grace period ended label
const gracePeriodEndedLabel = (
  <span>
    Grace period ended <br />{' '}
    <span style={{textTransform: 'none'}}>
      Awaiting contract status&hellip;
    </span>
  </span>
);

const cycleEllipsisFadeInProps = {duration: 150};

/**
 * OffchainVotingStatus
 *
 * A read-only component to show voting status information.
 *
 * @param {OffchainVotingStatusProps} props
 * @returns {JSX.Element}
 */
export function OffchainVotingStatus({
  countdownGracePeriodStartMs,
  proposal,
}: OffchainVotingStatusProps): JSX.Element {
  const {snapshotProposal} = proposal;

  /**
   * Selectors
   */

  const daoRegistryInstance = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.instance
  );

  /**
   * State
   */

  const [didVotePass, setDidVotePass] = useState<boolean>();
  const [gracePeriodEndMs, setGracePeriodEndMs] = useState<number>(0);

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

  // Determine grace period end
  useEffect(() => {
    if (!countdownGracePeriodStartMs || !daoRegistryInstance) return;

    getDAOConfigEntry(
      ContractDAOConfigKeys.offchainVotingGracePeriod,
      daoRegistryInstance
    )
      .then((r) => r && setGracePeriodEndMs(Number(r) * 1000))
      .catch(() => setGracePeriodEndMs(0));
  }, [countdownGracePeriodStartMs, daoRegistryInstance]);

  /**
   * Functions
   */

  function renderStatus() {
    // On loading
    if (!offchainVotingStartEndInitReady) {
      return (
        <CycleEllipsis
          intervalMs={200}
          fadeInProps={cycleEllipsisFadeInProps}
        />
      );
    }

    // Do not show a label as we provide one in addition to the timer.
    if (countdownGracePeriodStartMs) {
      return '';
    }

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
    // Vote countdown timer
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

    // Grace period countdown timer
    if (countdownGracePeriodStartMs && gracePeriodEndMs) {
      return (
        <ProposalPeriodComponent
          startPeriodMs={countdownGracePeriodStartMs}
          endLabel={gracePeriodEndLabel}
          endedLabel={gracePeriodEndedLabel}
          endPeriodMs={countdownGracePeriodStartMs + gracePeriodEndMs}
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
