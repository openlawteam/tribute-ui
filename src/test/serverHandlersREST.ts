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

// const signature = 0xaa4348e5db63d132b1d0b23a3e2a2a047a657594a1f736e8c9574babf0f8890131bcb08b0eb26f1ec2926aee0a11f8f042dc3212aa05ee67245791ab52ec97581c

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
