import React, {ButtonHTMLAttributes} from 'react';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';

import CheckSVG from '../../../assets/svg/CheckSVG';
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

export function VotingActionButtons(
  props: VotingActionButtonsProps
): JSX.Element {
  const {buttonProps, onClick, voteChosen, voteProgress} = props;

  /**
   * Functions
   */

  function getButtonARIALabel(
    choice: VoteChoices
  ): Partial<React.HTMLAttributes<HTMLElement>> {
    return voteProgress === choice
      ? {'aria-label': `Voting ${choice} \u2026`}
      : {};
  }

  function getButtonText(choice: VoteChoices): React.ReactNode {
    return voteProgress === choice ? (
      <Loader aria-label={`Currently voting ${choice}...`} role="img" />
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

  function renderVotedCheck(
    choice: VoteChoices,
    ariaLabel: string
  ): React.ReactNode {
    return voteChosen === choice ? (
      <>
        <CheckSVG aria-label={ariaLabel} />{' '}
      </>
    ) : (
      ''
    );
  }

  /**
   * Render
   */

  return (
    <>
      <button
        {...buttonProps}
        {...getButtonARIALabel(VoteChoices.Yes)}
        className={`proposaldetails__button`}
        onClick={handleClick(VoteChoices.Yes)}>
        {renderVotedCheck(VoteChoices.Yes, 'You voted yes')}
        {getButtonText(VoteChoices.Yes)}
      </button>

      <button
        {...buttonProps}
        {...getButtonARIALabel(VoteChoices.No)}
        className={`proposaldetails__button`}
        onClick={handleClick(VoteChoices.No)}>
        {renderVotedCheck(VoteChoices.No, 'You voted no')}
        {getButtonText(VoteChoices.No)}
      </button>
    </>
  );
}
