import {CoreProposalVoteChoices} from '@openlaw/snapshot-js-erc712';
import {VoteChoices} from './types';

/**
 * WEB3 CONFIG for TRIBUTE
 */

// Vote choices should be "yes", "no" unless Tribute contracts change.
export const VOTE_CHOICES: CoreProposalVoteChoices = [
  VoteChoices.Yes,
  VoteChoices.No,
];

// When signing data this is the `primaryType` key's value which is part of the data to sign.
export const PRIMARY_TYPE_ERC712 = 'Message';

export const TX_CYCLE_MESSAGES: string[] = [
  'Submitting\u2026',
  'Working\u2026',
  'DAOing\u2026',
  'Getting closer\u2026',
  'Dreaming of ETH\u2026',
];
