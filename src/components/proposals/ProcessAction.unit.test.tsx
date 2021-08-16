import {render, screen, waitFor} from '@testing-library/react';
import {Store} from 'redux';
import Web3 from 'web3';

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
} from '../../test/web3Responses';
import {DEFAULT_PROPOSAL_HASH, FakeHttpProvider} from '../../test/helpers';
import {ProposalData} from './types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import ProcessAction from './ProcessAction';
import userEvent from '@testing-library/user-event';
import Wrapper from '../../test/Wrapper';

describe('ProcessAction unit tests', () => {
  const actionId: string = '0xa8ED02b24B4E9912e39337322885b65b23CdF188';
  // Provide bare minimum proposal data needed for processing
  const proposalData: Partial<ProposalData> = {
    snapshotProposal: {
      idInDAO: DEFAULT_PROPOSAL_HASH,
      // Address should match what's set for chosen Redux adapter address
      actionId,
    } as any,
  };

  test('can process a proposal', async () => {
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
        <ProcessAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(screen.getByRole('button', {name: /^process/i})).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `ProcessAction` can find it specifically,
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
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: /^process/i}));

    expect(screen.getByText(/awaiting your confirmation/i)).toBeInTheDocument();

    await waitFor(() => {
      // Rotating message (`ProcessAction` starts with first)
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
      // Etherscan link
      expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /^done/i})).toBeInTheDocument();
      expect(screen.getByText(/proposal submitted!/i)).toBeInTheDocument();
      // Etherscan link
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });

  test('can process a proposal if connected address not a member', async () => {
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
        <ProcessAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(screen.getByRole('button', {name: /^process/i})).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `ProcessAction` can find it specifically,
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

    // Setup: Mock RPC calls for `processProposal`
    await waitFor(() => {
      mockWeb3Provider.injectResult(...ethEstimateGas({web3Instance}));
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: /^process/i}));

    expect(screen.getByText(/awaiting your confirmation/i)).toBeInTheDocument();

    await waitFor(() => {
      // Rotating message (`ProcessAction` starts with first)
      expect(screen.getByText(TX_CYCLE_MESSAGES[0])).toBeInTheDocument();
      // Etherscan link
      expect(screen.getByText(/view progress/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /^done/i})).toBeInTheDocument();
      expect(screen.getByText(/proposal submitted!/i)).toBeInTheDocument();
      // Etherscan link
      expect(screen.getByText(/view transaction/i)).toBeInTheDocument();
    });
  });

  test('can display error message if tx error', async () => {
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
        <ProcessAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(screen.getByRole('button', {name: /^process/i})).toBeInTheDocument();

    // Wait for the adapter to init
    await waitFor(() => {
      expect(
        wrapperStore.getState().contracts.OnboardingContract.contractAddress
      ).toBeDefined();
    });

    /**
     * Setup: change address of onboarding adapter so `ProcessAction` can find it specifically,
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
      // Don't mock gas estimation, instead provide an error
      mockWeb3Provider.injectError({
        code: 1234,
        message: 'Estimating gas failed',
      });
      mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
      mockWeb3Provider.injectResult(...ethGasPrice({web3Instance}));
      mockWeb3Provider.injectResult(...sendTransaction({web3Instance}));
      mockWeb3Provider.injectResult(...getTransactionReceipt({web3Instance}));
    });

    userEvent.click(screen.getByRole('button', {name: /^process/i}));

    expect(screen.getByText(/awaiting your confirmation/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', {name: /^process/i})
      ).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/estimating gas failed/i)).toBeInTheDocument();
    });
  });

  test('can disable process button if no wallet connected', async () => {
    render(
      <Wrapper useInit>
        <ProcessAction proposal={proposalData as ProposalData} />
      </Wrapper>
    );

    expect(screen.getByRole('button', {name: /^process/i})).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /^why is processing disabled?/i})
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', {name: /^why is processing disabled?/i})
    );

    // Disabled reason
    expect(
      screen.getByText(/your wallet is not connected./i)
    ).toBeInTheDocument();
  });
});
