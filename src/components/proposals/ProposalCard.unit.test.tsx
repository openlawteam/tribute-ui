import {render, screen, waitFor} from '@testing-library/react';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import userEvent from '@testing-library/user-event';

import {ProposalData} from './types';
import ProposalCard from './ProposalCard';
import Wrapper from '../../test/Wrapper';

describe('ProposalCard unit tests', () => {
  const yesterday = Date.now() / 1000 - 86400;
  const now = Date.now() / 1000;

  // Bare minimum fake data
  const fakeProposal: Partial<ProposalData> = {
    snapshotDraft: undefined,
    snapshotProposal: {
      idInSnapshot: 'abc123',
      idInDAO: 'abc123',
      msg: {
        payload: {
          name: 'Such a great proposal',
          body: '',
          choices: [VoteChoices.Yes, VoteChoices.No],
          start: yesterday,
          end: now,
          snapshot: 100,
          metadata: {},
        },
      },
    } as any,
  };

  const name =
    fakeProposal.snapshotDraft?.msg.payload.name ||
    fakeProposal.snapshotProposal?.msg.payload.name ||
    '';

  test('should render a proposal card', async () => {
    render(
      <Wrapper useInit useWallet>
        <ProposalCard
          name={name}
          proposal={fakeProposal as ProposalData}
          onClick={() => {}}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/such a great proposal/i)).toBeInTheDocument();
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBe(2);
    });
  });

  test('can click a proposal card', async () => {
    const spy = jest.fn();

    render(
      <Wrapper useInit useWallet>
        <ProposalCard
          name={name}
          proposal={fakeProposal as ProposalData}
          onClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/view proposal/i));

    await waitFor(() => {
      expect(spy.mock.calls.length).toBe(1);
      expect(spy.mock.calls[0][0]).toBe('abc123');
    });
  });

  test('can render correct button text from prop', async () => {
    const spy = jest.fn();

    const {rerender} = render(
      <Wrapper useInit useWallet>
        <ProposalCard
          buttonText="Sponsor proposal"
          name={name}
          proposal={fakeProposal as ProposalData}
          onClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/sponsor proposal/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/sponsor proposal/i));

    await waitFor(() => {
      expect(spy.mock.calls.length).toBe(1);
      expect(spy.mock.calls[0][0]).toBe('abc123');
    });

    rerender(
      <Wrapper useInit useWallet>
        <ProposalCard
          // Test when empty string
          buttonText=""
          name={name}
          proposal={fakeProposal as ProposalData}
          onClick={spy}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });
  });
});
