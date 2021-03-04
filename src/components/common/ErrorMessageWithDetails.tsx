import React from 'react';
import {normalizeString} from '../../util/helpers';

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

  // @link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#provider-errors
  const isWalletRejectedRequest =
    (error as any)?.code === 4001 ||
    /^(the )?user rejected (the )?request$/g.test(
      normalizeString(error?.message || '')
    );

  // @note Some wallets will provide proper error codes. The `4001` is a "user rejected transaction".
  return error && !isWalletRejectedRequest ? (
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
