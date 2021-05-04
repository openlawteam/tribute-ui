import {
  SnapshotDraftResponse,
  SnapshotProposalResponse,
  SnapshotSubmitBaseReturn,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {VOTE_CHOICES} from '../../components/web3/config';
import {
  DEFAULT_DRAFT_HASH,
  DEFAULT_ETH_ADDRESS,
  DEFAULT_PROPOSAL_HASH,
  DEFAULT_SIG,
} from '../helpers';

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
