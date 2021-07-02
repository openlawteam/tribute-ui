import {render, screen, waitFor} from '@testing-library/react';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import userEvent from '@testing-library/user-event';

import {OffchainVotingStatus} from './voting';
import {ProposalData} from './types';
import ProposalCard from './ProposalCard';
import Wrapper from '../../test/Wrapper';
import {useHistory, useLocation} from 'react-router';

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

  test('should render a proposal card with a status', async () => {
    render(
      <Wrapper useInit useWallet>
        <ProposalCard
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          onClick={() => {}}
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/such a great proposal/i)).toBeInTheDocument();
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBe(2);
    });
  });

  test('should render a proposal card without a status', async () => {
    render(
      <Wrapper useInit useWallet>
        <ProposalCard
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          onClick={() => {}}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/such a great proposal/i)).toBeInTheDocument();
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });
  });

  test('can click a proposal card (no `linkPath` set)', async () => {
    const spy = jest.fn();

    let testLocation: any;

    function TestApp() {
      const location = useLocation();

      testLocation = location;

      return (
        <ProposalCard
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          onClick={spy}
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
        />
      );
    }

    render(
      <Wrapper useInit useWallet>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/view proposal/i));

    await waitFor(() => {
      expect(testLocation.pathname).toMatch(/^\/abc123$/i);
      expect(spy.mock.calls.length).toBe(1);
      expect(spy.mock.calls[0][0]).toBe('abc123');
    });
  });

  test('can set a `linkPath: string`', async () => {
    let testLocation: any;

    function TestApp() {
      const location = useLocation();

      testLocation = location;

      return (
        <ProposalCard
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          linkPath="/some/path"
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
        />
      );
    }

    render(
      <Wrapper useInit useWallet>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/view proposal/i));

    await waitFor(() => {
      expect(testLocation.pathname).toBe('/some/path');
    });
  });

  test('can set a `linkPath: (id: string) => string`', async () => {
    let testLocation: any;

    function TestApp() {
      const location = useLocation();

      testLocation = location;

      return (
        <ProposalCard
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          linkPath={(id) => `/cool/${id}`}
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
        />
      );
    }

    render(
      <Wrapper useInit useWallet>
        <TestApp />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/view proposal/i));

    await waitFor(() => {
      expect(testLocation.pathname).toBe('/cool/abc123');
    });
  });

  test('can render correct button text from prop', async () => {
    const spy = jest.fn();

    const {rerender} = render(
      <Wrapper useInit useWallet>
        <ProposalCard
          buttonText="Sponsor proposal"
          name={name}
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          onClick={spy}
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
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
          proposalOnClickId={fakeProposal.snapshotProposal?.idInDAO as string}
          onClick={spy}
          renderStatus={() => (
            <OffchainVotingStatus proposal={fakeProposal as ProposalData} />
          )}
        />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/view proposal/i)).toBeInTheDocument();
    });
  });
});
