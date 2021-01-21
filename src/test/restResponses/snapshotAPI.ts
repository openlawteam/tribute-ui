import {
  SnapshotDraftData,
  SnapshotProposalData,
  SnapshotSubmitBaseReturn,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {VOTE_CHOICES} from '../../components/web3/config';
import {DEFAULT_CHAIN} from '../../config';
import {DEFAULT_ETH_ADDRESS, DEFAULT_SPACE} from '../helpers';

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
  symbol: 'TRIBE',
  skin: 'tribute',
  strategies: [
    {
      name: 'moloch',
      params: {
        address: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        symbol: 'TRIBE',
        decimals: 18,
      },
    },
  ],
  filters: {defaultTab: 'all', minScore: 1},
};

export const snapshotAPISubmitMessage: SnapshotSubmitBaseReturn = {
  uniqueId: 'abc123def456',
};

export const snapshotAPIDraftResponse: SnapshotDraftData = {
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
  space: DEFAULT_SPACE,
  actionId: DEFAULT_ETH_ADDRESS,
  chainId: DEFAULT_CHAIN,
  verifyingContract: DEFAULT_ETH_ADDRESS,
};

export const snapshotAPIProposalResponse: SnapshotProposalData = {
  payload: {
    body: 'Test Snapshot Proposal body content.',
    choices: VOTE_CHOICES,
    end: 1611234731,
    metadata: {},
    name: 'Test Snapshot Proposal',
    snapshot: 100,
    start: 1611234551,
  },
  timestamp: '1611234551',
  type: SnapshotType.proposal,
  version: '0.1.2',
  token: DEFAULT_ETH_ADDRESS,
  space: DEFAULT_SPACE,
  actionId: DEFAULT_ETH_ADDRESS,
  chainId: DEFAULT_CHAIN,
  verifyingContract: DEFAULT_ETH_ADDRESS,
};
