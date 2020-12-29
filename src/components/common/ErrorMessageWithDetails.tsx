import React from 'react';

import FadeIn from './FadeIn';

type ErrorMessageWithDetailsProps = {
  error?: Error;
  renderText: (() => React.ReactElement) | string;
  detailsProps?: React.HTMLAttributes<HTMLDetailsElement>;
};

export default function ErrorMessageWithDetails(
  props: ErrorMessageWithDetailsProps
) {
  const {error, renderText} = props;

  return error ? (
    <FadeIn>
      <p>{typeof renderText === 'string' ? renderText : renderText()}</p>

      {error && (
        <details {...props.detailsProps}>
          <summary style={{cursor: 'pointer', outline: 'none'}}>
            <small>Details</small>
          </summary>
          <p>
            <small>{error.message}</small>
          </p>
        </details>
      )}
    </FadeIn>
  ) : null;
}
