import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';
import Web3 from 'web3';
import userEvent from '@testing-library/user-event';

import {
  initContractOnboarding,
  setConnectedMember,
  SET_CONNECTED_MEMBER,
} from '../../store/actions';
import {
  ethBlockNumber,
  ethEstimateGas,
  ethGasPrice,
  getTransactionReceipt,
  sendTransaction,
  signTypedDataV4,
} from '../../test/web3Responses';
import {
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  DEFAULT_SIG,
  FakeHttpProvider,
} from '../../test/helpers';
import {ProposalData} from './types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {UNITS_ADDRESS} from '../../config';
import SubmitAction from './SubmitAction';
import Wrapper from '../../test/Wrapper';

describe('SubmitAction unit tests', () => {
  const sponsorButtonRegex: RegExp = /^sponsor$/i;
  const awaitingConfirmationRegex: RegExp = /^awaiting your confirmation/i;
  const viewProgressRegex: RegExp = /^view progress$/i;
  const viewTxRegex: RegExp = /^view transaction$/i;
  const proposalSubmittedRegex: RegExp = /^proposal submitted!$/i;
  const doneRegex: RegExp = /^done$/i;
  const whyIsDisabledRegex: RegExp = /^why is sponsoring disabled\?$/i;
  const actionId: string = '0xa8ED02b24B4E9912e39337322885b65b23CdF188';

  // Provide bare minimum proposal data needed for processing
  const defaultDraftData = (refetchSpy?: ReturnType<typeof jest.fn>) =>
    ({
      snapshotDraft: {
        idInDAO: DEFAULT_PROPOSAL_HASH,
        msg: {
          payload: {
            name: 'Some proposal',
            body: 'Another great proposal!',
            metadata: {
              submitActionArgs: [
                DEFAULT_ETH_ADDRESS,
                UNITS_ADDRESS,
                '100000000000000000', // .1 ETH
              ],
            },
          },
          timestamp: (Date.now() / 1000).toFixed(),
        },
        sig: DEFAULT_SIG,
        actionId,
      } as any,
      refetchProposalOrDraft: refetchSpy || (() => {}),
    } as Partial<ProposalData>);

  test('can submit a proposal', async () => {
    const refetchSpy = jest.fn();
    const proposalData = defaultDraftData(refetchSpy);

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;
    let wrapperStore: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
          wrapperStore = p.store;
        }}>
        <SubmitAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(
      screen.getByRole('button', {name: sponsorButtonRegex})
    ).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `SubmitAction` can find it specifically,
     * as all the test contracts use the same address.
     */
    await waitFor(async () => {
      await wrapperStore.dispatch<any>(
        initContractOnboarding(web3Instance, actionId)
      );
    });

    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBe(actionId);
    });

    // Setup: Mock RPC calls for `submitProposal`
    await waitFor(() => {
      // Mock block number response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));

      // Mock voting period seconds response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', '120')
      );

      // Mock signature response
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));

      // Mock rest of transaction responses
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: sponsorButtonRegex}));

    expect(screen.getByText(awaitingConfirmationRegex)).toBeInTheDocument();

    await waitFor(() => {
      // Rotating message (`SubmitAction` starts with first)
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();

      // Etherscan link
      expect(
        screen.getByRole('link', {name: viewProgressRegex})
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: doneRegex})).toBeInTheDocument();
      expect(screen.getByText(proposalSubmittedRegex)).toBeInTheDocument();
      // Etherscan link
      expect(screen.getByRole('link', {name: viewTxRegex})).toBeInTheDocument();
    });

    expect(refetchSpy.mock.calls.length).toBe(1);
  });

  test('should not submit a proposal if connected address not a member', async () => {
    const proposalData = defaultDraftData();

    let web3Instance: Web3;
    let wrapperStore: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          web3Instance = p.web3Instance;
          wrapperStore = p.store;
        }}>
        <SubmitAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(
      screen.getByRole('button', {name: sponsorButtonRegex})
    ).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `SubmitAction` can find it specifically,
     *   as all the test contracts use the same address.
     *
     * Setup: set connected wallet address to not be an active member
     */
    await waitFor(async () => {
      await wrapperStore.dispatch<any>(
        initContractOnboarding(web3Instance, actionId)
      );

      await wrapperStore.dispatch<any>(
        setConnectedMember({
          type: SET_CONNECTED_MEMBER,
          isActiveMember: false,
        } as any)
      );
    });

    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBe(actionId);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: sponsorButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: whyIsDisabledRegex})
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('button', {name: sponsorButtonRegex}));

    await waitFor(() => {
      expect(() => screen.getByText(awaitingConfirmationRegex)).toThrow();
    });

    expect(
      screen.getByRole('button', {name: whyIsDisabledRegex})
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', {name: whyIsDisabledRegex}));

    // Disabled reason
    expect(
      screen.getByText(
        /either you are not a member, or your membership is not active\./i
      )
    ).toBeInTheDocument();
  });

  test('can display error message if tx error', async () => {
    const proposalData = defaultDraftData();

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;
    let wrapperStore: Store;

    render(
      <Wrapper
        useInit
        useWallet
        getProps={(p) => {
          mockWeb3Provider = p.mockWeb3Provider;
          web3Instance = p.web3Instance;
          wrapperStore = p.store;
        }}>
        <SubmitAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(
      screen.getByRole('button', {name: sponsorButtonRegex})
    ).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `SubmitAction` can find it specifically,
     * as all the test contracts use the same address.
     */
    await waitFor(async () => {
      await wrapperStore.dispatch<any>(
        initContractOnboarding(web3Instance, actionId)
      );
    });

    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBe(actionId);
    });

    // Setup: Mock RPC calls for `processProposal`
    await waitFor(() => {
      // Mock block number response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));

      // Mock voting period seconds response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', '120')
      );

      // Mock signature response
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));

      // Don't mock gas estimation, instead provide an error
      mockWeb3Provider.injectError({
        code: 1234,
        message: 'Estimating gas failed',
      });

      // Mock rest of transaction responses
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: sponsorButtonRegex}));

    expect(screen.getByText(awaitingConfirmationRegex)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: sponsorButtonRegex})
      ).toBeEnabled();

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/estimating gas failed/i)).toBeInTheDocument();
    });
  });

  test('can disable process button if no wallet connected', async () => {
    const proposalData = defaultDraftData();

    render(
      <Wrapper useInit>
        <SubmitAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: sponsorButtonRegex})
      ).toBeDisabled();
    });

    expect(
      screen.getByRole('button', {name: whyIsDisabledRegex})
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', {name: whyIsDisabledRegex}));

    // Disabled reason
    expect(
      screen.getByText(/your wallet is not connected\./i)
    ).toBeInTheDocument();
  });
});
