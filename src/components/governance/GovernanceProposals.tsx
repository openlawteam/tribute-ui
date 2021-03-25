import React, {useEffect, useState} from 'react';

import {AsyncStatus} from '../../util/types';
import {BURN_ADDRESS} from '../../util/constants';
import {ProposalData} from '../proposals/types';
import {ProposalHeaderNames} from '../../util/enums';
import {truncateEthAddress} from '../../util/helpers';
import {useGovernanceProposals} from './hooks';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import LoaderWithEmoji from '../feedback/LoaderWithEmoji';
import ProposalCard from '../proposals/ProposalCard';

type GovernanceProposalsProps = {
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

export default function GovernanceProposals(
  props: GovernanceProposalsProps
): JSX.Element {
  const {actionId = BURN_ADDRESS, onProposalClick} = props;

  /**
   * State
   */

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

  // @todo Use batch voting results hook to do the same as `useOffchainVotingResults`
  // @todo Share logic between batch and single off-chain voting result hooks
  // @todo Pass `OffchainVotingResult` down to `OffchainVotingStatus` via `ProposalCard`

  /**
   * Variables
   */

  const {failedProposals, passedProposals, votingProposals} = filteredProposals;

  const isLoading: boolean = governanceProposalsStatus === AsyncStatus.PENDING;
  const isError: boolean = governanceProposalsStatus === AsyncStatus.REJECTED;
  const isLoadingDone: boolean =
    governanceProposalsStatus === AsyncStatus.FULFILLED;

  /**
   * Effects
   */

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

      // @todo Determine passed / failed status

      // voting proposal
      if (!hasVoteEnded) {
        filteredProposalsToSet.votingProposals.push(p);
      }

      // passed proposal
      // if (true) {
      //   filteredProposalsToSet.passedProposals.push(p);
      // }

      // failed proposal
      // if (true) {
      //   filteredProposalsToSet.failedProposals.push(p);
      // }
    });

    setFilteredProposals((prevState) => ({
      ...prevState,
      ...filteredProposalsToSet,
    }));
  }, [governanceProposals, governanceProposalsStatus]);

  /**
   * Functions
   */

  function renderProposalCards(
    proposals: ProposalData[]
  ): React.ReactNode | null {
    return proposals.map((proposal) => {
      const proposalId = proposal.snapshotProposal?.idInSnapshot;
      const proposalName = proposal.snapshotProposal?.msg.payload.name || '';

      if (!proposalId) return null;

      return (
        <ProposalCard
          key={proposalId}
          onClick={onProposalClick}
          proposal={proposal}
          // @note If the proposal title is not an address it will fall back to a normal, non-truncated string.
          name={truncateEthAddress(proposalName, 7)}
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
    isLoadingDone
  ) {
    return <p className="text-center">No proposals, yet!</p>;
  }

  // Render error
  if (isError) {
    return (
      <div className="text-center">
        <ErrorMessageWithDetails
          error={governanceProposalsError}
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
