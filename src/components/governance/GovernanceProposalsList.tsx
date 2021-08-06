import React, {Fragment, useEffect, useState} from 'react';

import {AsyncStatus} from '../../util/types';
import {BURN_ADDRESS} from '../../util/constants';
import {normalizeString} from '../../util/helpers';
import {OffchainVotingStatus} from '../proposals/voting';
import {ProposalData, VotingResult} from '../proposals/types';
import {ProposalHeaderNames} from '../../util/enums';
import {useGovernanceProposals} from './hooks';
import {useIsDefaultChain} from '../web3/hooks';
import {useOffchainVotingResults} from '../proposals/hooks';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import LoaderLarge from '../feedback/LoaderLarge';
import ProposalCard from '../proposals/ProposalCard';

type GovernanceProposalsListProps = {
  /**
   * The `actionId` to get proposals for in Snapshot Hub.
   */
  actionId?: string;
  /**
   * Optionally provide a click handler for `ProposalCard`.
   * The proposal's id (in Snapshot) will be provided as an argument.
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
  renderProposalCard?: (data: {
    proposalData: ProposalData;
    votingResult?: VotingResult;
  }) => React.ReactNode;
};

type FilteredProposals = {
  failedProposals: ProposalData[];
  passedProposals: ProposalData[];
  votingProposals: ProposalData[];
};

export default function GovernanceProposalsList(
  props: GovernanceProposalsListProps
): JSX.Element {
  const {
    actionId = BURN_ADDRESS,
    onProposalClick = () => {},
    proposalLinkPath,
    renderProposalCard,
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

  const {defaultChainError} = useIsDefaultChain();

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

  const error: Error | undefined =
    governanceProposalsError || offchainVotingResultsError || defaultChainError;

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

      // Did the vote pass by a simple majority?
      const didPassSimpleMajority: boolean = offchainResult
        ? offchainResult.Yes.units > offchainResult.No.units
        : false;

      // passed proposal
      if (didPassSimpleMajority) {
        filteredProposalsToSet.passedProposals.push(p);

        return;
      }

      // failed proposal
      if (!didPassSimpleMajority) {
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

  function renderProposalCards(
    proposals: ProposalData[]
  ): React.ReactNode | null {
    return proposals.map((proposal) => {
      const {snapshotProposal} = proposal;
      const proposalId = snapshotProposal?.idInSnapshot;
      const proposalName = snapshotProposal?.msg.payload.name || '';

      const votingStartMs: number =
        Number(snapshotProposal?.msg.payload.start || 0) * 1000;

      const votingEndMs: number =
        Number(snapshotProposal?.msg.payload.end || 0) * 1000;

      if (!proposalId) return null;

      const offchainResult = offchainVotingResults.find(
        ([proposalHash, _result]) =>
          normalizeString(proposalHash) === normalizeString(proposalId)
      )?.[1];

      if (renderProposalCard) {
        return (
          <Fragment key={proposalId}>
            {renderProposalCard({
              proposalData: proposal,
              votingResult: offchainResult,
            })}
          </Fragment>
        );
      }

      return (
        <ProposalCard
          key={proposalId}
          name={proposalName}
          linkPath={proposalLinkPath}
          onClick={onProposalClick}
          proposalOnClickId={proposalId}
          renderStatus={() => (
            <OffchainVotingStatus
              votingResult={offchainResult}
              countdownVotingEndMs={votingEndMs}
              countdownVotingStartMs={votingStartMs}
            />
          )}
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

  // Render no proposals
  if (
    !governanceProposals.length &&
    !Object.values(filteredProposals).flatMap((p) => p).length &&
    governanceProposalsStatus === AsyncStatus.FULFILLED
  ) {
    return <p className="text-center">No proposals, yet!</p>;
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
