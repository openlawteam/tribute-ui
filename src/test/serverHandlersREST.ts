import {rest} from 'msw';

import {SNAPSHOT_HUB_API_URL} from '../config';
import {
  snapshotAPIDraftResponse,
  snapshotAPIProposalResponse,
  snapshotAPIRootResponse,
  snapshotAPISpaceResponse,
  snapshotAPISubmitMessage,
} from './restResponses';

/**
 * Snapshot
 */

const getSnapshotAPIRoot = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIRootResponse))
);

const getSnapshotAPISpace = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api/spaces/:spaceName`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPISpaceResponse))
);

const getSnapshotAPIDraft = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api/:spaceName/draft/:id`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIDraftResponse))
);

const getSnapshotAPIProposal = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api/:spaceName/proposal/:id`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPIProposalResponse))
);

const postSnapshotAPIMessage = rest.post(
  `${SNAPSHOT_HUB_API_URL}/api/message`,
  async (_req, res, ctx) => res(ctx.json(snapshotAPISubmitMessage))
);

/**
 * HANDLERS TO EXPORT
 */

const handlers = [
  getSnapshotAPIDraft,
  getSnapshotAPIProposal,
  getSnapshotAPIRoot,
  getSnapshotAPISpace,
  postSnapshotAPIMessage,
];

export {handlers};
