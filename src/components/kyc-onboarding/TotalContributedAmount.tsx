import {formatNumber} from '../../util/helpers';
import {useTotalAmountContributedMultisig} from '.';
import FadeIn from '../common/FadeIn';

type TotalContributedAmountProps = {
  multisigAddress: string;
  render?: (
    v: ReturnType<typeof useTotalAmountContributedMultisig> & {
      formatted: string;
    }
  ) => JSX.Element | null;
};

export function TotalContributedAmount(
  props: TotalContributedAmountProps
): JSX.Element | null {
  const {multisigAddress, render} = props;

  const result = useTotalAmountContributedMultisig(multisigAddress);

  if (render) {
    return render({
      ...result,
      formatted: formatNumber(Math.floor(result.amountContributed)),
    });
  }

  // @todo add same wrapping styles as below so the text doesn't "jump" on DOM insert.
  if (!result.amountContributed) {
    return <div></div>;
  }

  return (
    <FadeIn>
      {/* @todo add same wrapping styles as above so the text doesn't "jump" on DOM insert. */}
      <div>
        {formatNumber(Math.floor(result.amountContributed))} ETH contributed
      </div>
    </FadeIn>
  );
}
