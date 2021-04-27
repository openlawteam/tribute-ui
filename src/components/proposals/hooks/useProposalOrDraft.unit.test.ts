import {waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {SnapshotType} from '@openlaw/snapshot-js-erc712';

import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
} from '../../../test/restResponses';
import {
  DEFAULT_DRAFT_HASH,
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
} from '../../../test/helpers';
import {AsyncStatus} from '../../../util/types';
import {BURN_ADDRESS} from '../../../util/constants';
import {rest, server} from '../../../test/server';
import {SNAPSHOT_HUB_API_URL} from '../../../config';
import {useProposalOrDraft} from '.';
import {VotingAdapterName} from '../../adapters-extensions/enums';
import Wrapper from '../../../test/Wrapper';

const mockWeb3ResponsesDraft: Parameters<typeof Wrapper>[0]['getProps'] = ({
  mockWeb3Provider,
  web3Instance,
}) => {
  /**
   * Mock results for `useProposalsVotingAdapter`
   */

  // Mock `dao.votingAdapter` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [0, [web3Instance.eth.abi.encodeParameter('address', BURN_ADDRESS)]]
    )
  );
};

const mockWeb3ResponsesProposal: Parameters<typeof Wrapper>[0]['getProps'] = ({
  mockWeb3Provider,
  web3Instance,
}) => {
  /**
   * Mock results for `useProposalsVotingAdapter`
   */

  // Mock `dao.votingAdapter` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [web3Instance.eth.abi.encodeParameter('address', DEFAULT_ETH_ADDRESS)],
      ]
    )
  );

  // Mock `IVoting.getAdapterName` responses
  mockWeb3Provider.injectResult(
    web3Instance.eth.abi.encodeParameters(
      ['uint256', 'bytes[]'],
      [
        0,
        [
          web3Instance.eth.abi.encodeParameter(
            'string',
            VotingAdapterName.OffchainVotingContract
          ),
        ],
      ]
    )
  );
};

describe('useProposalOrDraft unit tests', () => {
  test('no snapshot type: should return correct data when searching', async () => {
    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesProposal,
          },
        }
      );

      const idKey = Object.keys(snapshotAPIProposalResponse)[0];
      const proposal = snapshotAPIProposalResponse[idKey];

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert fulfilled state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotProposal).toStrictEqual({
          ...proposal,
          idInDAO: proposal.data.erc712DraftHash,
          idInSnapshot: idKey,
        });
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.proposalNotFound).toBe(false);

        // Assert `daoProposalVotingAdapter` data
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterAddress
        ).toBe(DEFAULT_ETH_ADDRESS);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterName
        ).toBe(VotingAdapterName.OffchainVotingContract);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getVotingAdapterABI
        ).toBeInstanceOf(Function);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getWeb3VotingAdapterContract
        ).toBeInstanceOf(Function);
      });
    });
  });

  test('no snapshot type: should return correct data for draft if proposal returns no data', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      const draftIdkey = Object.keys(snapshotAPIDraftResponse)[0];
      const draft = snapshotAPIDraftResponse[draftIdkey];

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert fulfilled state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toStrictEqual({
          ...draft,
          idInDAO: draftIdkey,
          idInSnapshot: draftIdkey,
        });
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.proposalNotFound).toBe(false);

        // Assert `daoProposalVotingAdapter` data
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  test('no snapshot type: should return correct data if draft and proposal return no data', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toBe(undefined);
        expect(result.current.proposalData?.snapshotProposal).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toBe(undefined);
        expect(result.current.proposalData?.snapshotProposal).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(true);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });

      const data = result.current.proposalData?.getCommonSnapshotProposalData();

      expect(data).toBe(undefined);
    });
  });

  test('no snapshot type: should return correct data for draft if proposal errors', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      const draftIdkey = Object.keys(snapshotAPIDraftResponse)[0];
      const draft = snapshotAPIDraftResponse[draftIdkey];

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert fulfilled state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toStrictEqual({
          ...draft,
          idInDAO: draftIdkey,
          idInSnapshot: draftIdkey,
        });
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.proposalNotFound).toBe(false);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  test('no snapshot type: should return correct data if draft and proposal errors', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(false);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });

      const data = result.current.proposalData?.getCommonSnapshotProposalData();

      expect(data).toBe(undefined);
    });
  });

  /**
   * DRAFT
   */

  test('draft: should return correct data when searching', async () => {
    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH, SnapshotType.draft),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      const draftIdkey = Object.keys(snapshotAPIDraftResponse)[0];
      const draft = snapshotAPIDraftResponse[draftIdkey];

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert fulfilled state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotDraft).toStrictEqual({
          ...draft,
          idInDAO: draftIdkey,
          idInSnapshot: draftIdkey,
        });
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.proposalNotFound).toBe(false);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );

        expect(
          result.current.proposalData?.getCommonSnapshotProposalData()
        ).toStrictEqual({
          ...draft,
          idInDAO: draftIdkey,
          idInSnapshot: draftIdkey,
        });
      });
    });
  });

  test('draft: should return correct data if draft returns no data', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH, SnapshotType.draft),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(true);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  test('draft: should return correct data if draft errors', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH, SnapshotType.draft),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(false);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  /**
   * Proposal
   */

  test('proposal: should return correct data when searching', async () => {
    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH, SnapshotType.proposal),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesProposal,
          },
        }
      );

      const idKey = Object.keys(snapshotAPIProposalResponse)[0];
      const proposal = snapshotAPIProposalResponse[idKey];

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotProposal).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert fulfilled state
      await waitFor(() => {
        expect(result.current.proposalData?.snapshotProposal).toStrictEqual({
          ...proposal,
          idInDAO: proposal.data.erc712DraftHash,
          idInSnapshot: idKey,
        });
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
        expect(result.current.proposalNotFound).toBe(false);

        expect(
          result.current.proposalData?.getCommonSnapshotProposalData()
        ).toStrictEqual({
          ...proposal,
          idInDAO: proposal.data.erc712DraftHash,
          idInSnapshot: idKey,
        });

        // Assert `daoProposalVotingAdapter` data
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterAddress
        ).toBe(DEFAULT_ETH_ADDRESS);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterName
        ).toBe(VotingAdapterName.OffchainVotingContract);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getVotingAdapterABI
        ).toBeInstanceOf(Function);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getWeb3VotingAdapterContract
        ).toBeInstanceOf(Function);
      });
    });
  });

  test('proposal: should return correct data if proposal returns no data', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.json({}))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH, SnapshotType.proposal),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesProposal,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(true);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  test('proposal: should return correct data if proposal errors', async () => {
    server.use(
      ...[
        rest.get(
          `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
          async (_req, res, ctx) => res(ctx.status(500))
        ),
      ]
    );

    await act(async () => {
      const {result} = await renderHook(
        () => useProposalOrDraft(DEFAULT_PROPOSAL_HASH, SnapshotType.proposal),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesProposal,
          },
        }
      );

      // Assert initial state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBe(undefined);
        expect(result.current.proposalStatus).toBe(AsyncStatus.STANDBY);
        expect(result.current.proposalNotFound).toBe(false);
      });

      // Assert rejected state
      await waitFor(() => {
        expect(result.current.proposalData).toBe(undefined);
        expect(result.current.proposalError).toBeInstanceOf(Error);
        expect(result.current.proposalStatus).toBe(AsyncStatus.REJECTED);
        expect(result.current.proposalNotFound).toBe(false);
        expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
          undefined
        );
      });
    });
  });

  /**
   * Refetch
   */

  test('can refetch', async () => {
    await act(async () => {
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
            async (_req, res, ctx) => res(ctx.status(500))
          ),
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
            async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
          ),
        ]
      );

      const {rerender, result, waitForNextUpdate} = await renderHook(
        () => useProposalOrDraft(DEFAULT_DRAFT_HASH),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: mockWeb3ResponsesDraft,
          },
        }
      );

      const draftIdKey = Object.keys(snapshotAPIDraftResponse)[0];
      const draft = snapshotAPIDraftResponse[draftIdKey];

      const idKey = Object.keys(snapshotAPIProposalResponse)[0];
      const proposal = snapshotAPIProposalResponse[idKey];

      await waitFor(() => {
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);
      });

      expect(result.current.proposalData?.snapshotDraft).toStrictEqual({
        ...draft,
        idInDAO: draftIdKey,
        idInSnapshot: draftIdKey,
      });

      expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
        undefined
      );

      // Set up mock REST response for refetch
      server.use(
        ...[
          rest.get(
            `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
            async (_req, res, ctx) => res(ctx.json(snapshotAPIProposalResponse))
          ),
        ]
      );

      rerender({
        useInit: true,
        useWallet: true,
        // Set up mock Web3 responses for refetch
        getProps: mockWeb3ResponsesProposal,
      });

      expect(result.current.proposalData?.snapshotProposal).toBe(undefined);
      expect(result.current.proposalData?.daoProposalVotingAdapter).toBe(
        undefined
      );

      // Request refetch
      result.current.proposalData?.refetchProposalOrDraft();

      await waitForNextUpdate();

      // Should not be `AsyncStatus.PENDING` on refetch
      expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);

      await waitFor(() => {
        // Should not be `AsyncStatus.PENDING` on refetch
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);

        expect(result.current.proposalData?.snapshotProposal).toStrictEqual({
          ...proposal,
          idInDAO: proposal.data.erc712DraftHash,
          idInSnapshot: idKey,
        });
      });

      await waitFor(() => {
        // Should not be `AsyncStatus.PENDING` on refetch
        expect(result.current.proposalStatus).toBe(AsyncStatus.FULFILLED);

        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getVotingAdapterABI
        ).toBeInstanceOf(Function);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.getWeb3VotingAdapterContract
        ).toBeInstanceOf(Function);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterAddress
        ).toBe(DEFAULT_ETH_ADDRESS);
        expect(
          result.current.proposalData?.daoProposalVotingAdapter
            ?.votingAdapterName
        ).toBe(VotingAdapterName.OffchainVotingContract);
      });
    });
  });
});
