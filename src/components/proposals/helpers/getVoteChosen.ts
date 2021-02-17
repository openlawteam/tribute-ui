import {VoteChoicesIndex} from '@openlaw/snapshot-js-erc712';

import {normalizeString} from '../../../util/helpers';
import {SnapshotProposal} from '../types';
import {VoteChoices} from '../../web3/types';

export function getVoteChosen(
  votes: SnapshotProposal['votes'],
  account: string
): VoteChoices | undefined {
  const voteEntry = (votes || []).find((ve) =>
    Object.entries(ve).find(
      ([address, _voteData]) =>
        normalizeString(address) === normalizeString(account || '')
    )
  );

  if (voteEntry) {
    const voteData = Object.entries(voteEntry)[0][1];
    const choice = voteData.msg.payload.choice;

    return choice === VoteChoicesIndex.Yes ? VoteChoices.Yes : VoteChoices.No;
  }

  return undefined;
}
