import {rest} from 'msw';
import {SNAPSHOT_HUB_API_URL} from '../config';
import {
  snapshotAPIRootResponse,
  snapshotAPISpaceResponse,
  snapshotAPISubmitMessage,
} from './restResponses';

/**
 * Snapshot
 */

const snapshotAPIRoot = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api`,
  async (_, res, ctx) => res(ctx.json(snapshotAPIRootResponse))
);

const snapshotAPISpace = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api/spaces/:spaceName`,
  async (_, res, ctx) => res(ctx.json(snapshotAPISpaceResponse))
);

const snapshotAPIMessage = rest.post(
  `${SNAPSHOT_HUB_API_URL}/api/message`,
  async (_, res, ctx) => res(ctx.json(snapshotAPISubmitMessage))
);

/**
 * HANDLERS TO EXPORT
 */

const handlers = [snapshotAPIRoot, snapshotAPISpace, snapshotAPIMessage];

export {handlers};
