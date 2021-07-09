import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {ContractDAOConfigKeys} from '../../web3/types';
import {CycleEllipsis} from '../../feedback';
import {getDAOConfigEntry} from '../../web3/helpers';
import {ProposalData, VotingResult} from '../types';
import {StoreState} from '../../../store/types';
import {useOffchainVotingResults} from '../hooks';
import {useTimeStartEnd} from '../../../hooks';
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
  /**
   * If a fetched `VotingResult` is provided
   * it will save the need to fetch inside of this component.
   *
   * e.g. Governance proposals listing may fetch all voting results
   *   in order to filter the `ProposalCard`s and be able to provide the results.
   */
  votingResult?: VotingResult;
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
  votingResult,
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
   * Our hooks
   */

  const {hasTimeStarted, hasTimeEnded, timeStartEndInitReady} = useTimeStartEnd(
    proposal.snapshotProposal?.msg.payload.start,
    proposal.snapshotProposal?.msg.payload.end
  );

  const {offchainVotingResults} = useOffchainVotingResults(
    votingResult ? undefined : proposal.snapshotProposal
  );

  /**
   * Variables
   */

  // There is only one vote result entry as we only passed a single proposal
  const votingResultToUse = votingResult
    ? votingResult
    : offchainVotingResults[0]?.[1];

  const votingStartSeconds = snapshotProposal?.msg.payload.start || 0;
  const votingEndSeconds = snapshotProposal?.msg.payload.end || 0;
  const yesUnits = votingResultToUse?.Yes.units || 0;
  const noUnits = votingResultToUse?.No.units || 0;
  const totalUnits = votingResultToUse?.totalUnits;

  /**
   * Effects
   */

  useEffect(() => {
    if (!hasTimeEnded) return;

    setDidVotePass(yesUnits > noUnits);
  }, [hasTimeEnded, noUnits, yesUnits]);

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
    if (!timeStartEndInitReady) {
      return (
        <CycleEllipsis
          ariaLabel="Getting off-chain voting status"
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
    if (timeStartEndInitReady && hasTimeStarted && !hasTimeEnded) {
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
      hasVotingEnded={hasTimeEnded}
      noUnits={noUnits}
      totalUnits={totalUnits}
      yesUnits={yesUnits}
    />
  );
}
