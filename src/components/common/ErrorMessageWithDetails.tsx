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
      <div className="text-center">
        <p className="error-message">
          {typeof renderText === 'string' ? renderText : renderText()}
        </p>

        {error && (
          <details {...props.detailsProps}>
            <summary
              className="error-message"
              style={{cursor: 'pointer', outline: 'none'}}>
              <small>Details</small>
            </summary>
            <p className="error-message">
              <small>{error.message}</small>
            </p>
          </details>
        )}
      </div>
    </FadeIn>
  ) : null;
}
