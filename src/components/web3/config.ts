import {CoreProposalVoteChoices, VoteChoices} from './types';

/**
 * WEB3 CONFIG for TRIBUTE DAO
 */

// Vote choices should be "yes", "no" unless Moloch v3 contracts change.
export const VOTE_CHOICES: CoreProposalVoteChoices = [
  VoteChoices.Yes,
  VoteChoices.No,
];
