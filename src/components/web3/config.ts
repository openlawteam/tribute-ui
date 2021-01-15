import {CoreProposalVoteChoices, VoteChoices} from './types';

/**
 * WEB3 CONFIG for TRIBUTE DAO
 */

// Vote choices should be "yes", "no" unless Moloch v3 contracts change.
export const VOTE_CHOICES: CoreProposalVoteChoices = [
  VoteChoices.Yes,
  VoteChoices.No,
];

// When signing data this is the `primaryType` key's value which is part of the data to sign.
export const PRIMARY_TYPE_ERC712 = 'Message';
