import {CoreProposalVoteChoices, VoteChoices} from './types';

/**
 * WEB3 CONFIG for TRIBUTE DAO
 */

export const VOTE_LENGTH_SECONDS: number = 180; // 3 minutes

// Vote choices should be "yes", "no" unless Moloch v3 contracts change.
export const VOTE_CHOICES: CoreProposalVoteChoices = [
  VoteChoices.yes,
  VoteChoices.no,
];
