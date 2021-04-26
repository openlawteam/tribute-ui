import {lazy, Suspense} from 'react';
import {useSelector} from 'react-redux';

import {ContractAdapterNames} from '../web3/types';
import {CycleEllipsis} from '../feedback';
import {ProposalData} from './types';
import {StoreState} from '../../store/types';
import {VotingAdapterName} from '../adapters-extensions/enums';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';

type ProposalActionsProps = {
  adapterName: ContractAdapterNames;
  proposal: ProposalData;
};

/**
 * Lazy load action component tree
 */
const ProposalWithOffchainVoteActions = lazy(
  () => import('./ProposalWithOffchainVoteActions')
);

const fadeInProps = {duration: 150};
const cycleEllipsisStyles = {
  display: 'inline-block',
  width: '100%',
  fontSize: '1.5rem',
};

export default function ProposalActions(
  props: ProposalActionsProps
): JSX.Element {
  const {adapterName, proposal} = props;

  /**
   * Selectors
   */

  const daoVotingAdapterName = useSelector(
    (s: StoreState) => s.contracts.VotingContract?.adapterOrExtensionName
  ) as VotingAdapterName | undefined;

  /**
   * Variables
   */

  // Use the proposal's voting adapter (has been sponsored), or fall back to the DAO's (not-yet-sponsored).
  const votingAdapterName: VotingAdapterName | undefined =
    proposal.daoProposalVotingAdapter?.votingAdapterName ||
    daoVotingAdapterName;

  /**
   * Functions
   */

  function renderActions() {
    if (!votingAdapterName) {
      return <></>;
    }

    switch (votingAdapterName) {
      case VotingAdapterName.OffchainVotingContract:
        return (
          <ProposalWithOffchainVoteActions
            adapterName={adapterName}
            proposal={proposal}
          />
        );

      // @todo On-chain Voting
      case VotingAdapterName.VotingContract:
        return <></>;

      default:
        return (
          <ErrorMessageWithDetails
            error={
              new Error(
                `"${votingAdapterName}" is not a valid voting adapter name.`
              )
            }
            renderText="Something went wrong"
          />
        );
    }
  }

  /**
   * Render
   */

  return (
    <Suspense
      fallback={
        <span className="text-center" style={cycleEllipsisStyles}>
          <CycleEllipsis intervalMs={200} fadeInProps={fadeInProps} />
        </span>
      }>
      {renderActions()}
    </Suspense>
  );
}
