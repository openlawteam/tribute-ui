import {useState} from 'react';

import {MetaMaskRPCError} from '../../util/types';
import {normalizeString} from '../../util/helpers';
import FadeIn from './FadeIn';

type ErrorMessageWithDetailsProps = {
  detailsProps?: React.DetailsHTMLAttributes<HTMLDetailsElement>;
  error: Error | (() => React.ReactElement) | undefined;
  renderText: (() => React.ReactElement) | string;
};

export default function ErrorMessageWithDetails(
  props: ErrorMessageWithDetailsProps
) {
  const {error, renderText} = props;

  /**
   * State
   */

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /**
   * Variables
   */

  /**
   * Some wallets will provide proper error codes. The `4001` is a "user rejected transaction".
   *
   * @link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#provider-errors
   */
  const isWalletRejectedRequest =
    typeof error !== 'function' &&
    ((error as MetaMaskRPCError)?.code === 4001 ||
      /^(the )?user rejected (the )?request$/g.test(
        normalizeString(error?.message || '')
      ));

  const textToDisplay: React.ReactNode =
    typeof renderText === 'string' ? renderText : renderText();

  const areErrorMessageAndTextStringSame: boolean =
    typeof renderText === 'string' &&
    typeof error !== 'function' &&
    normalizeString(renderText) === normalizeString(error?.message || '')
      ? true
      : false;

  /**
   * Render
   */

  if (!error || isWalletRejectedRequest) return null;

  return (
    <FadeIn>
      <div className="text-center">
        <p className="error-message">{textToDisplay}</p>

        {error && !areErrorMessageAndTextStringSame && (
          <details {...props.detailsProps}>
            <summary
              aria-expanded={isExpanded}
              className="error-message"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{cursor: 'pointer', outline: 'none'}}>
              <small>Details</small>
            </summary>

            <p className="error-message">
              <small>
                {typeof error === 'function' ? error() : error.message}
              </small>
            </p>
          </details>
        )}
      </div>
    </FadeIn>
  );
}
