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
import {server, rest} from '../../test/server';
import {SNAPSHOT_HUB_API_URL, UNITS_ADDRESS} from '../../config';
import {TX_CYCLE_MESSAGES} from '../web3/config';
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

  async function setUpOnboardingAdapter({
    wrapperStore,
    web3Instance,
    actionId,
  }: {
    wrapperStore: Store;
    web3Instance: Web3;
    actionId: string;
  }) {
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

    // Wait for the adapter to be updated
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBe(actionId);
    });
  }

  // Provide bare minimum draft data needed for processing
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

  // Provide bare minimum proposal data needed for processing
  const defaultProposalData = (refetchSpy?: ReturnType<typeof jest.fn>) =>
    ({
      snapshotProposal: {
        idInDAO: DEFAULT_PROPOSAL_HASH,
        msg: {
          payload: {
            name: 'Some proposal',
            body: 'Another great proposal!',
            start: Math.floor(Date.now() / 1000),
            end: Math.floor(Date.now() / 1000) + 120,
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

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
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
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
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

  test('can submit a proposal to DAO if Snapshot Proposal already exists', async () => {
    const refetchSpy = jest.fn();
    const proposalData = defaultProposalData(refetchSpy);

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

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
    });

    // Setup: Mock RPC calls for `submitProposal`
    await waitFor(() => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
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

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
    });

    // Setup: set connected wallet address to not be an active member
    await waitFor(async () => {
      await wrapperStore.dispatch<any>(
        setConnectedMember({
          type: SET_CONNECTED_MEMBER,
          isActiveMember: false,
        } as any)
      );
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

    userEvent.click(screen.getByRole('button', {name: whyIsDisabledRegex}));

    // Disabled reason
    expect(
      screen.getByText(
        /either you are not a member, or your membership is not active\./i
      )
    ).toBeInTheDocument();
  });

  test('should not submit a proposal if no wallet connected', async () => {
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

      expect(
        screen.getByRole('button', {name: whyIsDisabledRegex})
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('button', {name: sponsorButtonRegex}));

    await waitFor(() => {
      expect(() => screen.getByText(awaitingConfirmationRegex)).toThrow();
    });

    userEvent.click(screen.getByRole('button', {name: whyIsDisabledRegex}));

    // Disabled reason
    expect(
      screen.getByText(/your wallet is not connected\./i)
    ).toBeInTheDocument();
  });

  test('should not submit a proposal if applicant check is not OK', async () => {
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

          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameters(
              ['uint256', 'bytes[]'],
              [
                0,
                [
                  // `isNotReservedAddress`
                  web3Instance.eth.abi.encodeParameter('bool', true),
                  // `isNotZeroAddress`
                  web3Instance.eth.abi.encodeParameter('bool', true),
                  // `isNotReservedAddress`
                  web3Instance.eth.abi.encodeParameter(
                    'address',
                    '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
                  ),
                ],
              ]
            )
          );
        }}>
        <SubmitAction
          checkApplicant={DEFAULT_ETH_ADDRESS}
          proposal={proposalData as ProposalData}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: sponsorButtonRegex})
      ).toBeDisabled();

      expect(
        screen.getByRole('button', {name: whyIsDisabledRegex})
      ).toBeInTheDocument();
    });

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
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
        /the applicant address 0x04028\.\.\.11d is already in use as a delegate key\. the address must be removed as a delegate before it can become a member\./i
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

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
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

  test('can display error message if Snapshot Hub error', async () => {
    // Mock Snapshot Hub error repsonse
    server.use(
      rest.post(`${SNAPSHOT_HUB_API_URL}/api/message`, async (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

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

    await waitFor(async () => {
      await setUpOnboardingAdapter({wrapperStore, web3Instance, actionId});
    });

    await waitFor(() => {
      // Mock block number response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));

      // Mock voting period seconds response from `useSignAndSubmitProposal`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('uint256', '120')
      );

      // Mock signature response
      mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: sponsorButtonRegex}));

    expect(screen.getByText(awaitingConfirmationRegex)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: sponsorButtonRegex})
      ).toBeEnabled();

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
