import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {ethBlockNumber, signTypedDataV4} from '../../test/web3Responses';
import {SET_CONNECTED_MEMBER} from '../../store/actions';
import CreateGovernanceProposal from './CreateGovernanceProposal';
import Wrapper from '../../test/Wrapper';

describe('CreateGovernanceProposal unit tests', () => {
  test('should not render form if not connected to a wallet', () => {
    render(
      <Wrapper>
        <CreateGovernanceProposal />
      </Wrapper>
    );

    expect(screen.getByText(/^governance proposal$/i)).toBeInTheDocument();
    expect(() => screen.getByLabelText(/title/i)).toThrow();
    expect(() => screen.getByLabelText(/description/i)).toThrow();
    expect(
      screen.getByText(/connect your wallet to submit a governance proposal/i)
    ).toBeInTheDocument();
  });

  test('should not render form if not a member', () => {
    let store: any;

    render(
      <Wrapper
        useWallet
        useInit
        getProps={(p) => {
          store = p.store;
        }}>
        <CreateGovernanceProposal />
      </Wrapper>
    );

    // Set a non-active member
    store.dispatch({
      type: SET_CONNECTED_MEMBER,
      ...store.getState().connectedMember,
      isActiveMember: false,
    });

    expect(screen.getByText(/^governance proposal$/i)).toBeInTheDocument();
    expect(() => screen.getByLabelText(/title/i)).toThrow();
    expect(() => screen.getByLabelText(/description/i)).toThrow();
    expect(
      screen.getByText(
        /either you are not a member, or your membership is not active\./i
      )
    ).toBeInTheDocument();
  });

  test('should render form', async () => {
    render(
      <Wrapper useWallet useInit>
        <CreateGovernanceProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/^governance proposal$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  test('should render form errors for blank fields', async () => {
    render(
      <Wrapper useWallet useInit>
        <CreateGovernanceProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/^governance proposal$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByLabelText(/title/i));
    userEvent.click(screen.getByLabelText(/description/i));
    userEvent.click(screen.getByLabelText(/title/i));

    await waitFor(() => {
      expect(screen.getAllByText(/this field is required\.$/i).length).toBe(2);
    });
  });

  test('should submit form', async () => {
    render(
      <Wrapper
        useWallet
        useInit
        getProps={({mockWeb3Provider, web3Instance}) => {
          // Mock the RPC calls from `buildProposalMessageHelper`
          mockWeb3Provider.injectResult(...ethBlockNumber({web3Instance}));
          // Mock offchain voting period call
          mockWeb3Provider.injectResult(
            web3Instance.eth.abi.encodeParameter('uint256', 123)
          );
          // Mock signature
          mockWeb3Provider.injectResult(...signTypedDataV4({web3Instance}));
        }}>
        <CreateGovernanceProposal />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/^governance proposal$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    // Type in the inputs
    await userEvent.type(screen.getByLabelText(/title/i), 'Great title', {
      delay: 100,
    });

    await userEvent.type(
      screen.getByLabelText(/description/i),
      'Great description!',
      {delay: 100}
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/great title/i)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/great description!/i)
      ).toBeInTheDocument();
    });

    act(() => {
      // Click submit
      userEvent.click(screen.getByRole('button', {name: /submit/i}));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/awaiting your confirmation/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByRole('button', {name: /submit/i})).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByRole('button', {name: /submit/i})).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByText(/done/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByRole('button', {name: /submit/i})).toBeDisabled();
    });
  });
});
