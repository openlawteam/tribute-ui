import React, {useEffect, useState} from 'react';

import {AsyncStatus} from '../../util/types';
import {DaoAdapterConstants} from '../adapters-extensions/enums';
import {ProposalData, ProposalFlag} from './types';
import {proposalHasFlag, proposalHasVotingState} from './helpers';
import {ProposalHeaderNames} from '../../util/enums';
import {truncateEthAddress} from '../../util/helpers';
import {useProposals, useProposalsVotingState} from './hooks';
import {VotingState} from './voting/types';
import ProposalCard from './ProposalCard';
import LoaderWithEmoji from '../feedback/LoaderWithEmoji';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';

type ProposalsProps = {
  adapterName: DaoAdapterConstants;
  onProposalClick: (id: string) => void;
};

type FilteredProposals = {
  failedProposals: ProposalData[];
  nonsponsoredProposals: ProposalData[];
  passedProposals: ProposalData[];
  votingProposals: ProposalData[];
};

export default function Proposals(props: ProposalsProps): JSX.Element {
  const {adapterName, onProposalClick} = props;

  /**
   * State
   */

  const [proposalIds, setProposalIds] = useState<string[]>([]);
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

  const {proposals, proposalsError, proposalsStatus} = useProposals({
    adapterName,
  });

  const {
    proposalsVotingState,
    proposalsVotingStateError,
    proposalsVotingStateStatus,
  } = useProposalsVotingState(proposalIds);

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
    proposalsStatus === AsyncStatus.PENDING ||
    proposalsVotingStateStatus === AsyncStatus.PENDING;

  const isLoadingDone: boolean =
    proposalsStatus === AsyncStatus.FULFILLED ||
    proposalsVotingStateStatus === AsyncStatus.FULFILLED;

  const isError: boolean =
    proposalsStatus === AsyncStatus.REJECTED ||
    proposalsVotingStateStatus === AsyncStatus.REJECTED;

  /**
   * Effects
   */

  // Set all proposal id's from proposals for the voting state hook.
  useEffect(() => {
    setProposalIds(
      proposals
        .map(
          (p) => p.snapshotDraft?.idInDAO || p.snapshotProposal?.idInDAO || ''
        )
        .filter(Boolean)
    );
  }, [proposals]);

  // Separate proposals into categories: non-sponsored, voting, passed, failed
  useEffect(() => {
    if (proposalsStatus !== AsyncStatus.FULFILLED) return;
    if (proposalsVotingStateStatus !== AsyncStatus.FULFILLED) return;

    const filteredProposalsToSet: FilteredProposals = {
      failedProposals: [],
      nonsponsoredProposals: [],
      passedProposals: [],
      votingProposals: [],
    };

    proposals.forEach((p) => {
      const voteState = proposalsVotingState.find(
        ([id]) =>
          id === (p.snapshotDraft?.idInDAO || p.snapshotProposal?.idInDAO || '')
      )?.[1];

      if (voteState === undefined || !p.daoProposal) return;

      // non-sponsored proposal
      if (
        proposalHasVotingState(VotingState.NOT_STARTED, voteState) &&
        proposalHasFlag(ProposalFlag.EXISTS, p.daoProposal.flags)
      ) {
        filteredProposalsToSet.nonsponsoredProposals.push(p);
      }

      // voting proposal
      if (
        (proposalHasVotingState(VotingState.GRACE_PERIOD, voteState) ||
          proposalHasVotingState(VotingState.IN_PROGRESS, voteState)) &&
        proposalHasFlag(ProposalFlag.SPONSORED, p.daoProposal.flags)
      ) {
        filteredProposalsToSet.votingProposals.push(p);
      }

      // passed proposal
      if (
        proposalHasVotingState(VotingState.PASS, voteState) &&
        (proposalHasFlag(ProposalFlag.SPONSORED, p.daoProposal.flags) ||
          proposalHasFlag(ProposalFlag.PROCESSED, p.daoProposal.flags))
      ) {
        filteredProposalsToSet.passedProposals.push(p);
      }

      // failed proposal
      if (
        (proposalHasVotingState(VotingState.NOT_PASS, voteState) ||
          proposalHasVotingState(VotingState.TIE, voteState)) &&
        (proposalHasFlag(ProposalFlag.SPONSORED, p.daoProposal.flags) ||
          proposalHasFlag(ProposalFlag.PROCESSED, p.daoProposal.flags))
      ) {
        filteredProposalsToSet.failedProposals.push(p);
      }
    });

    setFilteredProposals((prevState) => ({
      ...prevState,
      ...filteredProposalsToSet,
    }));
  }, [
    proposals,
    proposalsStatus,
    proposalsVotingState,
    proposalsVotingStateStatus,
  ]);

  /**
   * Functions
   */

  function renderProposalCards(
    proposals: ProposalData[]
  ): React.ReactNode | null {
    return proposals.map((proposal) => {
      const proposalId =
        proposal.snapshotDraft?.idInDAO || proposal.snapshotProposal?.idInDAO;
      const proposalName =
        proposal.snapshotDraft?.msg.payload.name ||
        proposal.snapshotProposal?.msg.payload.name ||
        '';

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
    !Object.values(proposals).length &&
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
          error={proposalsError || proposalsVotingStateError}
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
