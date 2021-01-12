import React, {useEffect} from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {truncateEthAddress} from '../../util/helpers';
import {
  fakeMemberProposals,
  FakeProposal,
} from '../../components/proposals/_mockData';
import ProposalDetails from '../../components/proposals/ProposalDetails';
import ProposalActions from '../../components/proposals/ProposalActions';
import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function MembershipDetails() {
  /**
   * Their hooks
   */

  // Get hash for fetching the proposal.
  // @todo Use this to check that proposal exists.
  const {proposalHash} = useParams<{proposalHash: string}>();
  const history = useHistory();

  /**
   * Variables
   */

  // @todo replace with actual proposal fetch and proposal exists check
  const memberProposal: FakeProposal | undefined = fakeMemberProposals.find(
    (proposal) => proposal.snapshotProposal.hash === proposalHash.toLowerCase()
  );

  /**
   * Effects
   */

  // Navigate to 404
  useEffect(() => {
    if (!memberProposal) {
      history.push('/404');
    }
  }, [history, memberProposal]);

  /**
   * Render
   */

  return (
    <RenderWrapper>
      <ProposalDetails
        proposal={memberProposal as FakeProposal}
        name={truncateEthAddress(
          (memberProposal as FakeProposal).snapshotProposal.name,
          7
        )}
        renderActions={() => (
          <ProposalActions proposal={memberProposal as FakeProposal} />
        )}
      />
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Functions
   */

  function viewAll(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    history.push('/membership');
  }

  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Membership</h2>
          <button className="titlebar__action" onClick={viewAll}>
            View all
          </button>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
