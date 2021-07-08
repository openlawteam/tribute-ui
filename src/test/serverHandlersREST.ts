import {rest} from 'msw';

import {COUPON_API_URL, SNAPSHOT_HUB_API_URL} from '../config';
import {
  ethGasStationResponse,
  snapshotAPIDraftResponse,
  snapshotAPIOffchainProofResponse,
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

const postSnapshotAPIOffchainProof = rest.post(
  `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proofs`,
  (_req, res, ctx) => res(ctx.status(201))
);

const getSnapshotAPIOffchainProof = rest.get(
  `${SNAPSHOT_HUB_API_URL}/api/:spaceName/offchain_proof/:merkleRoot`,
  (_req, res, ctx) => res(ctx.json(snapshotAPIOffchainProofResponse))
);

/**
 * Coupon Manager
 */

const patchRedeemedCoupon = rest.patch(
  `${COUPON_API_URL}/api/coupon/redeem`,
  async (_req, res, ctx) => res(ctx.status(200))
);

const postRedeemedCoupon = rest.post(
  `${COUPON_API_URL}/api/coupon/redeem`,
  async (_req, res, ctx) => res(ctx.status(200))
);

/**
 * ETHGasStation
 */

const ethGasStationAPI = rest.get(
  'https://ethgasstation.info/json/ethgasAPI.json',
  (_req, res, ctx) => res(ctx.json(ethGasStationResponse))
);

/**
 * HANDLERS TO EXPORT
 */

const handlers = [
  ethGasStationAPI,
  getSnapshotAPIDraft,
  getSnapshotAPIOffchainProof,
  getSnapshotAPIProposal,
  getSnapshotAPIRoot,
  getSnapshotAPISpace,
  postSnapshotAPIMessage,
  postSnapshotAPIOffchainProof,
  patchRedeemedCoupon,
  postRedeemedCoupon,
];

export {handlers};
