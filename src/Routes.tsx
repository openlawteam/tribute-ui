import {Route, Switch} from 'react-router-dom';

import {ENABLE_KYC_ONBOARDING} from './config';
// import AdapterOrExtensionManager from './components/adapters-extensions/AdapterOrExtensionManager';
import CreateGovernanceProposal from './pages/governance/CreateGovernanceProposal';
import CreateOnboardingProposal from './pages/onboarding/CreateOnboardingProposal';
import CreateTransferProposal from './pages/transfers/CreateTransferProposal';
import CreateTributeProposal from './pages/tributes/CreateTributeProposal';
import GetStarted from './pages/start/GetStarted';
import GovernanceProposalDetails from './pages/governance/GovernanceProposalDetails';
import GovernanceProposals from './pages/governance/GovernanceProposals';
import KycOnboardingForm from './pages/kyc-onboarding/KycOnboardingForm';
import MemberProfile from './pages/members/MemberProfile';
import Members from './pages/members/Members';
import Onboarding from './pages/onboarding/Onboarding';
import OnboardingDetails from './pages/onboarding/OnboardingDetails';
import NotFound from './pages/subpages/NotFound';
import Redeem from './pages/redeem/Redeem';
import TransferDetails from './pages/transfers/TransferDetails';
import Transfers from './pages/transfers/Transfers';
import TributeDetails from './pages/tributes/TributeDetails';
import Tributes from './pages/tributes/Tributes';
import Privacy from './pages/privacy/Privacy';
// import Collection from './pages/collection/Collection';



const proposalIdParameter: string = ':proposalId';

export default function Routes() {
  return (
    <Switch>
      {[
        // Index page
        <Route key="splash" exact path="/" render={() => <GetStarted />} />,
        ENABLE_KYC_ONBOARDING && (
          <Route
            key="join"
            exact
            path="/join"
            render={() => <KycOnboardingForm />}
          />
        ),
        <Route
          key="onboard"
          exact
          path="/onboard"
          render={() => <CreateOnboardingProposal />}
        />,

        <Route
          key="onboarding"
          exact
          path="/onboarding"
          render={() => <Onboarding />}
        />,
        <Route
          key="onboarding-details"
          exact
          path={`/onboarding/${proposalIdParameter}`}
          render={() => <OnboardingDetails />}
        />,
        <Route
          key="transfer"
          exact
          path="/transfer"
          render={() => <CreateTransferProposal />}
        />,
        <Route
          key="transfers"
          exact
          path="/transfers"
          render={() => <Transfers />}
        />,
        <Route
          key="transfer-details"
          exact
          path={`/transfers/${proposalIdParameter}`}
          render={() => <TransferDetails />}
        />,
        <Route
          key="tribute"
          exact
          path="/tribute"
          render={() => <CreateTributeProposal />}
        />,
        <Route
          key="tributes"
          exact
          path="/tributes"
          render={() => <Tributes />}
        />,
        <Route
          key="tribute-details"
          exact
          path={`/tributes/${proposalIdParameter}`}
          render={() => <TributeDetails />}
        />,
        <Route
          key="governance-proposal"
          exact
          path="/governance-proposal"
          render={() => <CreateGovernanceProposal />}
        />,
        <Route
          key="governance-proposals"
          exact
          path="/governance"
          render={() => <GovernanceProposals />}
        />,
        <Route
          key="governance-proposal-details"
          exact
          path={`/governance/${proposalIdParameter}`}
          render={() => <GovernanceProposalDetails />}
        />,
        <Route
          key="members"
          exact
          path="/members"
          render={() => <Members />}
        />,

        <Route
          key="member-profile"
          exact
          path="/members/:ethereumAddress"
          render={() => <MemberProfile />}
        />,
        // <Route
        //   key="collection"
        //   exact
        //   path="/Collection"
        //   render={() => <Collection />}
        // />,
        <Route
        key="privacy"
        exact
        path="/Privacy"
        render={() => <Privacy />}
      />,
        
        // @note Disabling DAO Manager for now because we paused on maintaining
        // it.
        // <Route
        //   key="dao-manager"
        //   exact
        //   path="/dao-manager"
        //   render={() => <AdapterOrExtensionManager />}
        // />,
        <Route key="redeem" exact path="/redeem" render={() => <Redeem />} />,
        // 404 component (note: does not redirect to a route to maintain original path)
        <Route key="no-match" component={NotFound} />,
      ]}
    </Switch>
  );
}
