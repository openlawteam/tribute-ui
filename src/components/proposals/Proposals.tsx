import React, {Fragment, useEffect, useState} from 'react';

import {
  DaoAdapterConstants,
  VotingAdapterName,
} from '../adapters-extensions/enums';
import {AsyncStatus} from '../../util/types';
import {BURN_ADDRESS} from '../../util/constants';
import {OffchainVotingStatus} from './voting';
import {ProposalData, ProposalFlag} from './types';
import {proposalHasFlag, proposalHasVotingState} from './helpers';
import {ProposalHeaderNames} from '../../util/enums';
import {useIsDefaultChain} from '../web3/hooks';
import {useProposals} from './hooks';
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
    includeProposalsExistingOnlyOffchain,
  });

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
    proposalsStatus === AsyncStatus.PENDING;

  const error: Error | undefined = proposalsError || defaultChainError;

  /**
   * Effects
   */

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
        daoProposalVotes: votesData,
      } = p;

      if (!daoProposal) return;

      const noSnapshotVotes: boolean = p.snapshotProposal?.votes?.length === 0;

      const offchainResultNotYetSubmitted: boolean =
        voteState !== undefined &&
        proposalHasVotingState(VotingState.TIE, voteState) &&
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

      /**
       * Voting proposal: voting has ended and is not in grace period,
       * off-chain result was not submitted, and there are votes (need to submit to get true result).
       *
       * @note Should be placed before "failed" logic.
       */
      if (offchainResultNotYetSubmitted && noSnapshotVotes === false) {
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
        (proposalHasVotingState(VotingState.GRACE_PERIOD, voteState) ||
          proposalHasVotingState(VotingState.TIE, voteState)) &&
        proposalHasFlag(ProposalFlag.SPONSORED, daoProposal.flags) &&
        offchainResultNotYetSubmitted &&
        noSnapshotVotes
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
  }, [includeProposalsExistingOnlyOffchain, proposals, proposalsStatus]);

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

      if (renderProposalCard) {
        return (
          <Fragment key={proposalId}>
            {renderProposalCard({proposalData: proposal})}
          </Fragment>
        );
      }

      return (
        <ProposalCard
          key={proposalId}
          linkPath={proposalLinkPath}
          name={proposalName}
          onClick={onProposalClick}
          proposalOnClickId={proposalId}
          renderStatus={() => {
            switch (proposal.daoProposalVotingAdapter?.votingAdapterName) {
              case VotingAdapterName.OffchainVotingContract:
                return <OffchainVotingStatus proposal={proposal} />;
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
