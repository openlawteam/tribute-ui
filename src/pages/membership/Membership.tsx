import React from 'react';
import {useHistory} from 'react-router-dom';

import {ProposalHeaderNames} from '../../util/enums';
import {truncateEthAddress} from '../../util/helpers';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';
import {useProposals} from '../../components/proposals/hooks/useProposals';
import {DaoConstants} from '../../components/adapters-extensions/enums';
import ProposalCard from '../../components/proposals/ProposalCard';
// import {
//   fakeMembershipProposalsVoting,
//   fakeMembershipProposalsRequest,
//   fakeMembershipProposalsPassed,
//   fakeMembershipProposalsFailed,
//   FakeProposal,
// } from '../../components/proposals/_mockData';

export default function Membership() {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Our hooks
   */

  const {proposals, proposalsStatus} = useProposals({
    adapterName: DaoConstants.ONBOARDING,
  });

  /**
   * Variables
   */

  const votingProposals = /* renderProposalCards(fakeMembershipProposalsVoting) */ [] as any;
  const requestProposals = /* renderProposalCards(fakeMembershipProposalsRequest) */ [] as any;
  const passedProposals = /* renderProposalCards(fakeMembershipProposalsPassed) */ [] as any;
  const failedProposals = /* renderProposalCards(fakeMembershipProposalsFailed) */ [] as any;

  /**
   * Functions
   */

  // @note TEST
  return (
    <RenderWrapper>
      {proposals.map((proposal) => {
        return (
          <ProposalCard
            key={
              proposal.snapshotDraft?.idInDAO ||
              proposal.snapshotProposal?.idInDAO
            }
            onClick={(id) => history.push(`membership/${id}`)}
            proposal={proposal}
            name={truncateEthAddress(
              proposal.snapshotProposal?.msg.payload.name ||
                proposal.snapshotDraft?.msg.payload.name ||
                '',
              7
            )}
          />
        );
      })}
    </RenderWrapper>
  );

  /* function renderProposalCards(proposals: FakeProposal[]) {
    return proposals.map((proposal) => {
      return (
        <ProposalCard
          key={proposal.snapshotProposal.hash}
          onClick={handleClickProposalDetails(proposal.snapshotProposal.hash)}
          proposal={proposal}
          name={truncateEthAddress(proposal.snapshotProposal.name, 7)}
        />
      );
    });
  } */

  /* function handleClickProposalDetails(proposalHash: string) {
    return () => {
      if (!proposalHash) return;

      history.push(`/membership/${proposalHash}`);
    };
  } */

  /**
   * Render
   */

  // return (
  //   <RenderWrapper>
  //     <div className="grid--fluid grid-container">
  //       {/* VOTING PROPOSALS */}
  //       {votingProposals.length > 0 && (
  //         <>
  //           <div className="grid__header">{ProposalHeaderNames.VOTING}</div>
  //           <div className="grid__cards">{votingProposals}</div>
  //         </>
  //       )}

  //       {/* PENDING PROPOSALS (DRAFTS, NOT SPONSORED) */}
  //       {requestProposals.length > 0 && (
  //         <>
  //           <div className="grid__header">{ProposalHeaderNames.REQUESTS}</div>
  //           <div className="grid__cards">{requestProposals}</div>
  //         </>
  //       )}

  //       {/* PASSED PROPOSALS */}
  //       {passedProposals.length > 0 && (
  //         <>
  //           <div className="grid__header">{ProposalHeaderNames.PASSED}</div>
  //           <div className="grid__cards">{passedProposals}</div>
  //         </>
  //       )}

  //       {/* FAILED PROPOSALS */}
  //       {failedProposals.length > 0 && (
  //         <>
  //           <div className="grid__header">{ProposalHeaderNames.FAILED}</div>
  //           <div className="grid__cards">{failedProposals}</div>
  //         </>
  //       )}
  //     </div>
  //   </RenderWrapper>
  // );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function viewMembers(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    history.push('/members');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Membership</h2>
          <button className="titlebar__action" onClick={viewMembers}>
            View members
          </button>
        </div>
        {/* RENDER CHILDREN */}
        @TODO
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
