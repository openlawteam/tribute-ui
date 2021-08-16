import {Fragment, useEffect, useMemo, useState} from 'react';

import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../adapters-extensions/enums';
import {
  calculateVotingTimeRanges,
  proposalHasFlag,
  proposalHasVotingState,
} from './helpers';
import {AsyncStatus} from '../../util/types';
import {BURN_ADDRESS} from '../../util/constants';
import {ContractDAOConfigKeys} from '../web3/types';
import {normalizeString} from '../../util/helpers';
import {OffchainVotingStatus} from './voting';
import {ProposalData, ProposalFlag} from './types';
import {ProposalHeaderNames} from '../../util/enums';
import {useDaoConfigurations} from '../../hooks';
import {useIsDefaultChain} from '../web3/hooks';
import {useProposals, useOffchainVotingResults} from './hooks';
import {VotingState} from './voting/types';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import LoaderLarge from '../feedback/LoaderLarge';
import ProposalCard from './ProposalCard';

type ProposalsProps = {
  adapterName: DaoAdapterConstants;
  /**
   * Optionally provide a click handler for `ProposalCard`.
   * The proposal's id (in the DAO) will be provided as an argument.
   * Defaults to noop: `() => {}`
   */
  onProposalClick?: (id: string) => void;
  /**
   * The path to link to. Defaults to `${location.pathname}/${proposalOnClickId}`.
   */
  proposalLinkPath?: Parameters<typeof ProposalCard>['0']['linkPath'];
  /**
   * Optionally render a custom proposal card.
   */
  renderProposalCard?: (data: {proposalData: ProposalData}) => React.ReactNode;
  /**
   * To handle proposal types where the first step is creating a snapshot
   * draft/offchain proposal only (no onchain proposal exists)
   */
  includeProposalsExistingOnlyOffchain?: boolean;
};

type FilteredProposals = {
  failedProposals: ProposalData[];
  nonsponsoredProposals: ProposalData[];
  passedProposals: ProposalData[];
  votingProposals: ProposalData[];
};

const configurationKeysToGet: ContractDAOConfigKeys[] = [
  ContractDAOConfigKeys.offchainVotingVotingPeriod,
  ContractDAOConfigKeys.offchainVotingGracePeriod,
];

export default function Proposals(props: ProposalsProps): JSX.Element {
  const {
    adapterName,
    onProposalClick = () => {},
    proposalLinkPath,
    renderProposalCard,
    includeProposalsExistingOnlyOffchain = false,
  } = props;

  /**
   * State
   */

  const [proposalsForVotingResults, setProposalsForVotingResults] = useState<
    ProposalData['snapshotProposal'][]
  >([]);

  const [filteredProposals, setFilteredProposals] = useState<FilteredProposals>(
    {
      failedProposals: [],
      nonsponsoredProposals: [],
      passedProposals: [],
      votingProposals: [],
    }
  );

  /**
   * Our hooks
   */

  const {
    daoConfigurations: [offchainVotingPeriod, offchainGracePeriod],
  } = useDaoConfigurations(configurationKeysToGet);

  const {proposals, proposalsError, proposalsStatus} = useProposals(
    useMemo(
      () => ({
        adapterName,
        includeProposalsExistingOnlyOffchain,
      }),
      [adapterName, includeProposalsExistingOnlyOffchain]
    )
  );

  const {
    offchainVotingResults,
    offchainVotingResultsError,
    offchainVotingResultsStatus,
  } = useOffchainVotingResults(proposalsForVotingResults);

  const {defaultChainError} = useIsDefaultChain();

  /**
   * Variables
   */

  const {
    failedProposals,
    nonsponsoredProposals,
    passedProposals,
    votingProposals,
  } = filteredProposals;

  const isLoading: boolean =
    proposalsStatus === AsyncStatus.STANDBY ||
    proposalsStatus === AsyncStatus.PENDING ||
    // Getting ready to fetch using `useOffchainVotingResults`; helps to show
    // continuous loader.
    (offchainVotingResultsStatus === AsyncStatus.STANDBY &&
      proposalsForVotingResults.length > 0) ||
    offchainVotingResultsStatus === AsyncStatus.PENDING;

  const error: Error | undefined =
    proposalsError || offchainVotingResultsError || defaultChainError;

  /**
   * Effects
   */

  useEffect(() => {
    setProposalsForVotingResults(proposals.map((p) => p.snapshotProposal));
  }, [proposals]);

  // Separate proposals into categories: non-sponsored, voting, passed, failed
  useEffect(() => {
    if (proposalsStatus !== AsyncStatus.FULFILLED) return;

    const filteredProposalsToSet: FilteredProposals = {
      failedProposals: [],
      nonsponsoredProposals: [],
      passedProposals: [],
      votingProposals: [],
    };

    proposals.forEach((p) => {
      const {
        daoProposal,
        daoProposalVotingState: voteState,
        daoProposalVote: votesData,
      } = p;

      if (!daoProposal) return;

      const noSnapshotVotes: boolean = p.snapshotProposal?.votes?.length === 0;

      const offchainResultNotYetSubmitted: boolean =
        voteState !== undefined &&
        (proposalHasVotingState(VotingState.GRACE_PERIOD, voteState) ||
          proposalHasVotingState(VotingState.TIE, voteState)) &&
        proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags) &&
        votesData?.OffchainVotingContract?.reporter === BURN_ADDRESS;

      // Non-sponsored proposal
      if (voteState === undefined) {
        if (includeProposalsExistingOnlyOffchain) {
          filteredProposalsToSet.nonsponsoredProposals.push(p);
        } else if (proposalHasFlag(ProposalFlag.EXISTS, daoProposal.flags)) {
          filteredProposalsToSet.nonsponsoredProposals.push(p);
        }

        return;
      }

      // Passed proposal
      if (
        voteState !== undefined &&
        proposalHasVotingState(VotingState.PASS, voteState) &&
        (proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags) ||
          proposalHasFlag(ProposalFlag.PROCESSED, daoProposal.flags))
      ) {
        filteredProposalsToSet.passedProposals.push(p);

        return;
      }

      const offchainResult = offchainVotingResults.find(
        ([proposalHash, _result]) =>
          normalizeString(proposalHash) ===
          normalizeString(p.snapshotProposal?.idInDAO || '')
      )?.[1];

      // Did the vote pass by a simple majority?
      const didPassSimpleMajority: boolean = offchainResult
        ? offchainResult.Yes.units > offchainResult.No.units
        : false;

      /**
       * Voting proposal: voting has ended, off-chain result was not submitted,
       * and there are votes with a passing result (need to submit to get true
       * "passed" result).
       *
       * @note For now, we can assume across all adapters that if the vote did
       * not pass then the result does not need to be submitted (proposal would
       * fall back to "failed" logic).
       *
       * @note Should be placed before "failed" logic.
       */
      if (
        offchainResultNotYetSubmitted &&
        noSnapshotVotes === false &&
        didPassSimpleMajority
      ) {
        filteredProposalsToSet.votingProposals.push(p);

        return;
      }

      // Failed proposal
      if (
        voteState !== undefined &&
        (proposalHasVotingState(VotingState.NOT_PASS, voteState) ||
          proposalHasVotingState(VotingState.TIE, voteState)) &&
        (proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags) ||
          proposalHasFlag(ProposalFlag.PROCESSED, daoProposal.flags))
      ) {
        filteredProposalsToSet.failedProposals.push(p);

        return;
      }

      // Failed proposal: no Snapshot votes
      if (
        voteState !== undefined &&
        offchainResultNotYetSubmitted &&
        noSnapshotVotes
      ) {
        filteredProposalsToSet.failedProposals.push(p);

        return;
      }

      // Failed proposal: result not submitted; vote did not pass
      if (
        voteState !== undefined &&
        offchainResultNotYetSubmitted &&
        !didPassSimpleMajority
      ) {
        filteredProposalsToSet.failedProposals.push(p);

        return;
      }

      // Voting proposal
      if (
        voteState !== undefined &&
        (proposalHasVotingState(VotingState.GRACE_PERIOD, voteState) ||
          proposalHasVotingState(VotingState.IN_PROGRESS, voteState)) &&
        proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags)
      ) {
        filteredProposalsToSet.votingProposals.push(p);

        return;
      }
    });

    setFilteredProposals((prevState) => ({
      ...prevState,
      ...filteredProposalsToSet,
    }));
  }, [
    includeProposalsExistingOnlyOffchain,
    offchainVotingResults,
    proposals,
    proposalsStatus,
  ]);

  /**
   * Functions
   */

  function renderProposalCards(
    proposals: ProposalData[]
  ): React.ReactNode | null {
    return proposals.map((proposal) => {
      const {
        daoProposalVote,
        daoProposalVotingAdapter,
        snapshotDraft,
        snapshotProposal,
      } = proposal;

      const proposalId = snapshotDraft?.idInDAO || snapshotProposal?.idInDAO;
      const votingAdapterName = daoProposalVotingAdapter?.votingAdapterName;

      let gracePeriodEndMs: number = 0;
      let gracePeriodStartMs: number = 0;
      let voteEndMs: number = 0;
      let voteStartMs: number = 0;

      switch (votingAdapterName) {
        case VotingAdapterName.OffchainVotingContract:
          const {startingTime, gracePeriodStartingTime} =
            daoProposalVote?.[VotingAdapterName.OffchainVotingContract] || {};

          const times = calculateVotingTimeRanges({
            gracePeriodLength: offchainGracePeriod,
            gracePeriodStartingTime,
            votePeriodLength: offchainVotingPeriod,
            voteStartingTime: startingTime,
          });

          gracePeriodEndMs = times.gracePeriodEndMs;
          gracePeriodStartMs = times.gracePeriodStartMs;
          voteEndMs = times.voteEndMs;
          voteStartMs = times.voteStartMs;

          break;

        // @todo On-chain Voting
        // case VotingAdapterName.VotingContract:
        //   return <></>
        default:
          break;
      }

      if (!proposalId) return null;

      if (renderProposalCard) {
        return (
          <Fragment key={proposalId}>
            {renderProposalCard({proposalData: proposal})}
          </Fragment>
        );
      }

      const proposalName =
        snapshotDraft?.msg.payload.name ||
        snapshotProposal?.msg.payload.name ||
        '';

      const votingResult = offchainVotingResults.find(
        ([proposalHash, _result]) =>
          normalizeString(proposalHash) === normalizeString(proposalId)
      )?.[1];

      return (
        <ProposalCard
          key={proposalId}
          linkPath={proposalLinkPath}
          name={proposalName}
          onClick={onProposalClick}
          proposalOnClickId={proposalId}
          renderStatus={() => {
            switch (votingAdapterName) {
              case VotingAdapterName.OffchainVotingContract:
                return (
                  <OffchainVotingStatus
                    countdownGracePeriodEndMs={gracePeriodEndMs}
                    countdownGracePeriodStartMs={gracePeriodStartMs}
                    countdownVotingEndMs={voteEndMs}
                    countdownVotingStartMs={voteStartMs}
                    votingResult={votingResult}
                  />
                );
              // @todo On-chain Voting
              // case VotingAdapterName.VotingContract:
              //   return <></>
              default:
                return <></>;
            }
          }}
        />
      );
    });
  }

  /**
   * Render
   */

  // Render loading
  if (isLoading && !error) {
    return (
      <div className="loader--large-container">
        <LoaderLarge />
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="text-center">
        <ErrorMessageWithDetails
          error={error}
          renderText="Something went wrong while getting the proposals."
        />
      </div>
    );
  }

  // Render no proposals
  if (
    !Object.values(filteredProposals).flatMap((p) => p).length &&
    proposalsStatus === AsyncStatus.FULFILLED
  ) {
    return <p className="text-center">No proposals, yet!</p>;
  }

  // Render proposals
  return (
    <div className="grid--fluid grid-container">
      {/* VOTING PROPOSALS */}
      {votingProposals.length > 0 && (
        <>
          <div className="grid__header">{ProposalHeaderNames.VOTING}</div>
          <div className="grid__cards">
            {renderProposalCards(votingProposals)}
          </div>
        </>
      )}

      {/* PENDING PROPOSALS (DRAFTS, NOT SPONSORED) */}
      {nonsponsoredProposals.length > 0 && (
        <>
          <div className="grid__header">{ProposalHeaderNames.REQUESTS}</div>
          <div className="grid__cards">
            {renderProposalCards(nonsponsoredProposals)}
          </div>
        </>
      )}

      {/* PASSED PROPOSALS */}
      {passedProposals.length > 0 && (
        <>
          <div className="grid__header">{ProposalHeaderNames.PASSED}</div>
          <div className="grid__cards">
            {renderProposalCards(passedProposals)}
          </div>
        </>
      )}

      {/* FAILED PROPOSALS */}
      {failedProposals.length > 0 && (
        <>
          <div className="grid__header">{ProposalHeaderNames.FAILED}</div>
          <div className="grid__cards">
            {renderProposalCards(failedProposals)}
          </div>
        </>
      )}
    </div>
  );
}
