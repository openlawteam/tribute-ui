import React from 'react';

import {formatNumber} from '../../util/helpers';
import {useTotalAmountContributedMultisig} from '.';
import FadeIn from '../common/FadeIn';

type TotalContributedAmountProps = {
  render?: (
    v: ReturnType<typeof useTotalAmountContributedMultisig> & {
      formatted: string;
    }
  ) => JSX.Element | null;
  rootElementProps?: React.HTMLAttributes<HTMLDivElement>;
};

export function TotalContributedAmount(
  props: TotalContributedAmountProps
): JSX.Element | null {
  const {render, rootElementProps} = props;

  const result = useTotalAmountContributedMultisig();

  // Custom render
  if (render) {
    return render({
      ...result,
      formatted: formatNumber(Math.floor(result.amountContributed)),
    });
  }

  const {amountContributed} = result;

  // Don't render text until there is a value
  if (!amountContributed) {
    // By assigning any of the same props (e.g. styles) it helps the text not unexpectedly "jump".
    return <div aria-hidden {...rootElementProps} />;
  }

  return (
    <FadeIn>
      <div {...rootElementProps}>
        {formatNumber(Math.floor(amountContributed))} ETH Contributed
      </div>
    </FadeIn>
  );
}
