import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {SET_CONNECTED_MEMBER} from '../../store/actions';
import Wrapper from '../../test/Wrapper';
import CreateGovernanceProposal from './CreateGovernanceProposal';

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
});
