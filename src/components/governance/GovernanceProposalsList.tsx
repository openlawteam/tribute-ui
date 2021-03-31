import React, {useEffect, useState} from 'react';

import {AsyncStatus} from '../../util/types';
import {BURN_ADDRESS} from '../../util/constants';
import {normalizeString} from '../../util/helpers';
import {ProposalData, VotingResult} from '../proposals/types';
import {ProposalHeaderNames} from '../../util/enums';
import {useGovernanceProposals} from './hooks';
import {useOffchainVotingResults} from '../proposals/hooks';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import LoaderWithEmoji from '../feedback/LoaderWithEmoji';
import ProposalCard from '../proposals/ProposalCard';

type GovernanceProposalsListProps = {
  /**
   * The `actionId` to get proposals for in Snapshot Hub.
   */
  actionId?: string;
  onProposalClick: (id: string) => void;
};

type FilteredProposals = {
  failedProposals: ProposalData[];
  passedProposals: ProposalData[];
  votingProposals: ProposalData[];
};

// @todo Pass `VotingResult` down to `OffchainVotingStatus` via `ProposalCard`
export default function GovernanceProposalsList(
  props: GovernanceProposalsListProps
): JSX.Element {
  const {actionId = BURN_ADDRESS, onProposalClick} = props;

  /**
   * State
   */

  const [proposalsForVotingResults, setProposalsForVotingResults] = useState<
    ProposalData['snapshotProposal'][]
  >([]);
  const [filteredProposals, setFilteredProposals] = useState<FilteredProposals>(
    {
      failedProposals: [],
      passedProposals: [],
      votingProposals: [],
    }
  );

  /**
   * Our hooks
   */

  const {
    governanceProposals,
    governanceProposalsError,
    governanceProposalsStatus,
  } = useGovernanceProposals({
    actionId,
  });

  const {
    offchainVotingResults,
    offchainVotingResultsError,
    offchainVotingResultsStatus,
  } = useOffchainVotingResults(proposalsForVotingResults);

  /**
   * Variables
   */

  const {failedProposals, passedProposals, votingProposals} = filteredProposals;

  const isLoading: boolean =
    governanceProposalsStatus === AsyncStatus.STANDBY ||
    governanceProposalsStatus === AsyncStatus.PENDING ||
    // Getting ready to fetch using `useOffchainVotingResults`; helps to show continuous loader.
    (offchainVotingResultsStatus === AsyncStatus.STANDBY &&
      proposalsForVotingResults.length > 0) ||
    offchainVotingResultsStatus === AsyncStatus.PENDING;

  const isError: boolean =
    governanceProposalsStatus === AsyncStatus.REJECTED ||
    offchainVotingResultsStatus === AsyncStatus.REJECTED;

  /**
   * Effects
   */

  useEffect(() => {
    setProposalsForVotingResults(
      governanceProposals.map((gp) => gp.snapshotProposal)
    );
  }, [governanceProposals]);

  // Separate proposals into categories: voting, passed, failed
  useEffect(() => {
    if (governanceProposalsStatus !== AsyncStatus.FULFILLED) return;

    const filteredProposalsToSet: FilteredProposals = {
      failedProposals: [],
      passedProposals: [],
      votingProposals: [],
    };

    governanceProposals.forEach((p) => {
      const end = p.snapshotProposal?.msg.payload.end || 0;
      const hasVoteEnded = end < Math.ceil(Date.now() / 1000);

      // voting proposal
      if (!hasVoteEnded) {
        filteredProposalsToSet.votingProposals.push(p);

        return;
      }

      const offchainResult = offchainVotingResults.find(
        ([proposalHash, _result]) =>
          normalizeString(proposalHash) ===
          normalizeString(p.snapshotProposal?.idInSnapshot || '')
      )?.[1];

      if (!offchainResult) return;

      const didPass = didPassSimpleMajority(offchainResult);

      // passed proposal
      if (didPass) {
        filteredProposalsToSet.passedProposals.push(p);

        return;
      }

      // failed proposal
      if (!didPass) {
        filteredProposalsToSet.failedProposals.push(p);

        return;
      }
    });

    setFilteredProposals((prevState) => ({
      ...prevState,
      ...filteredProposalsToSet,
    }));
  }, [governanceProposals, governanceProposalsStatus, offchainVotingResults]);

  /**
   * Functions
   */

  function didPassSimpleMajority(offchainVoteResult: VotingResult): boolean {
    return offchainVoteResult.Yes.shares > offchainVoteResult.No.shares;
  }

  function renderProposalCards(
    proposals: ProposalData[]
  ): React.ReactNode | null {
    return proposals.map((proposal) => {
      const proposalId = proposal.snapshotProposal?.idInSnapshot;
      const proposalName = proposal.snapshotProposal?.msg.payload.name || '';

      if (!proposalId) return null;

      const offchainResult = offchainVotingResults.find(
        ([proposalHash, _result]) =>
          normalizeString(proposalHash) === normalizeString(proposalId)
      )?.[1];

      return (
        <ProposalCard
          key={proposalId}
          name={proposalName}
          onClick={onProposalClick}
          proposal={proposal}
          proposalOnClickId={proposalId}
          votingResult={offchainResult}
        />
      );
    });
  }

  /**
   * Render
   */

  // Render loading
  if (isLoading && !isError) {
    return (
      <div className="loader--emjoi-container">
        <LoaderWithEmoji />
      </div>
    );
  }

  // Render no proposals
  if (
    !governanceProposals.length &&
    !Object.values(filteredProposals).flatMap((p) => p).length &&
    governanceProposalsStatus === AsyncStatus.FULFILLED
  ) {
    return <p className="text-center">No proposals, yet!</p>;
  }

  // Render error
  if (isError) {
    return (
      <div className="text-center">
        <ErrorMessageWithDetails
          error={governanceProposalsError || offchainVotingResultsError}
          renderText="Something went wrong while getting the proposals."
        />
      </div>
    );
  }

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
