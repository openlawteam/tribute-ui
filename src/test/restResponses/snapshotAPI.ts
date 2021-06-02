import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotSubmitBaseReturn,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {
  DEFAULT_DRAFT_HASH,
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  DEFAULT_SIG,
} from '../helpers';
import {SnapshotOffchainProofResponse} from '../../components/proposals/voting/types';
import {VOTE_CHOICES} from '../../components/web3/config';

export const snapshotAPIRootResponse = {
  name: 'snapshot-hub',
  network: 'testnet',
  version: '0.1.2',
  tag: 'alpha',
  relayer: '0xEd7B3f2902f2E1B17B027bD0c125B674d293bDA0',
};

export const snapshotAPISpaceResponse = {
  token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
  name: 'Tribute',
  network: '1',
  symbol: 'TRIBUTE',
  skin: 'tribute',
  strategies: [
    {
      name: 'tribute',
      params: {
        address: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        symbol: 'TRIBUTE',
        decimals: 18,
      },
    },
  ],
  filters: {defaultTab: 'all', minScore: 1},
};

export const snapshotAPISubmitMessage: SnapshotSubmitBaseReturn = {
  uniqueId: DEFAULT_PROPOSAL_HASH,
};

export const snapshotAPIDraftResponse: SnapshotDraftResponse = {
  [DEFAULT_DRAFT_HASH]: {
    address: DEFAULT_ETH_ADDRESS,
    data: {
      authorIpfsHash: DEFAULT_DRAFT_HASH,
      sponsored: false,
    },
    msg: {
      payload: {
        body: 'Test Snapshot Draft body content.',
        choices: VOTE_CHOICES,
        metadata: {},
        name: 'Test Snapshot Draft',
      },
      timestamp: '1611234551',
      type: SnapshotType.draft,
      version: '0.1.2',
      token: DEFAULT_ETH_ADDRESS,
    },
    actionId: DEFAULT_ETH_ADDRESS,
    sig: DEFAULT_SIG,
    authorIpfsHash: DEFAULT_DRAFT_HASH,
    relayerIpfsHash: 'QmPdW2zQm9yAqUSihD1TJHoSiQTsJHuWrn8n98qpeBGjzE',
  },
};

export const snapshotAPIProposalResponse: SnapshotProposalResponse = {
  [DEFAULT_PROPOSAL_HASH]: {
    address: DEFAULT_ETH_ADDRESS,
    data: {
      authorIpfsHash: DEFAULT_PROPOSAL_HASH,
      /**
       * The hash of a proposal's draft.
       * This property will not be present if the proposal does not have a draft.
       */
      erc712DraftHash: DEFAULT_DRAFT_HASH,
    },
    msg: {
      payload: {
        body: 'Test Snapshot Proposal body content.',
        choices: VOTE_CHOICES,
        end: 1611234731,
        metadata: {},
        name: 'Test Snapshot Proposal',
        snapshot: 100,
        start: 1611234551,
      },
      token: DEFAULT_ETH_ADDRESS,
      timestamp: '1611234551',
      type: SnapshotType.proposal,
      version: '0.1.2',
    },
    actionId: DEFAULT_ETH_ADDRESS,
    sig: DEFAULT_SIG,
    authorIpfsHash: DEFAULT_PROPOSAL_HASH,
    relayerIpfsHash: 'QmPdW2zQm9yAqUSihD1TJHoSiQTsJHuWrn8n98qpeBGjzE',
  },
};

export const snapshotAPIOffchainProofResponse: SnapshotOffchainProofResponse = {
  merkle_root:
    '0x2f6a1ec9f67c87e7956228a0838b0980748f2dda936a0ebaf3e929f192fa7b6c',
  space: 'tribute',
  steps: [
    {
      choice: 2,
      index: 0,
      nbNo: '1',
      nbYes: '0',
      proof: [],
      proposalId:
        '0x946cb6d94b8c8082656af73149a514382b6ea6e87045129825b94266afcf229c',
      sig: '0x2ec030f67e0655ad7cacc5625b535442f1075a8ee02acbd8a6b9a77c75fe3f8068b8a360276facfd4e87c022f2c6d15ada22f5fd40f53e2aba2021a40c6368981c',
      timestamp: 1620652809,
    },
  ],
};
