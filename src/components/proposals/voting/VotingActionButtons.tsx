import React, {ButtonHTMLAttributes} from 'react';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';

import Loader from '../../feedback/Loader';

type VotingActionButtonsProps = {
  /**
   * Common <button /> props for both buttons
   */
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onClick: (choice: VoteChoices) => void;
  /**
   * Which vote did the current connected user submit?
   */
  voteChosen?: VoteChoices;
  /**
   * Shows a loading spinner for a voting button.
   */
  voteProgress?: VoteChoices;
};

/**
 * @todo Implement vote chosen
 */
export function VotingActionButtons(
  props: VotingActionButtonsProps
): JSX.Element {
  const {buttonProps, onClick, voteChosen, voteProgress} = props;

  /**
   * Functions
   */

  const getVotedClass = (choice: VoteChoices): string =>
    voteChosen === choice ? 'votingbutton--voted' : '';

  function getARIALabel(
    choice: VoteChoices
  ): Partial<React.HTMLAttributes<HTMLElement>> {
    return voteProgress === choice
      ? {'aria-label': `Voting ${choice} \u2026`}
      : {};
  }

  function getVotingText(choice: VoteChoices): React.ReactNode {
    return voteProgress === choice ? (
      <Loader aria-label={`Voting ${choice} spinner image`} role="img" />
    ) : voteChosen === choice ? (
      `Voted ${choice}`
    ) : (
      `Vote ${choice}`
    );
  }

  function handleClick(choice: VoteChoices) {
    return () => {
      onClick(choice);
    };
  }

  /**
   * Render
   */

  return (
    <>
      <button
        {...buttonProps}
        {...getARIALabel(VoteChoices.Yes)}
        className={`proposaldetails__button ${getVotedClass(VoteChoices.Yes)}`}
        onClick={handleClick(VoteChoices.Yes)}>
        {getVotingText(VoteChoices.Yes)}
      </button>
      <button
        {...buttonProps}
        {...getARIALabel(VoteChoices.No)}
        className={`proposaldetails__button ${getVotedClass(VoteChoices.No)}`}
        onClick={handleClick(VoteChoices.No)}>
        {getVotingText(VoteChoices.No)}
      </button>
    </>
  );
}
