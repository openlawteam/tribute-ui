import {useEffect, useRef} from 'react';
import {v4 as uuidv4} from 'uuid';
import ReactTooltip from 'react-tooltip';
import useClipboard from 'react-use-clipboard';

type CopyWithTooltipProps = {
  render: (p: CopyWithTooltipRenderProps) => JSX.Element;
  textToCopy: string;
  tooltipProps?: ReactTooltip['props'];
};

type CopyWithTooltipRenderProps = {
  elementRef: React.RefObject<any>;
  tooltipID: string;
  isCopied: boolean;
  setCopied: ReturnType<typeof useClipboard>[1];
};

export function CopyWithTooltip(props: CopyWithTooltipProps): JSX.Element {
  const {render, textToCopy = '', tooltipProps} = props;

  /**
   * Their hooks
   */

  const [isCopied, setCopied] = useClipboard(textToCopy, {
    // `isCopied` will go back to `false` after 3 seconds.
    successDuration: 3000,
  });

  /**
   * Effects
   */

  /**
   * Workaround to handle tooltip positioning after text update
   *
   * @see https://github.com/wwayne/react-tooltip/issues/638
   */
  useEffect(() => {
    if (!elementRef.current) return;

    if (isCopied) {
      ReactTooltip.show(elementRef.current);
    }

    if (!isCopied && isTooltipShownRef.current) {
      ReactTooltip.show(elementRef.current);
    }
  }, [isCopied]);

  /**
   * Refs
   */

  const elementRef = useRef<any>(null);
  const isTooltipShownRef = useRef<boolean>(false);
  const tooltipIDRef = useRef<string>(uuidv4());

  return (
    <>
      {render({
        elementRef,
        isCopied,
        setCopied,
        tooltipID: tooltipIDRef.current,
      })}

      <ReactTooltip
        delayShow={200}
        effect="solid"
        {...tooltipProps}
        afterHide={(args) => {
          isTooltipShownRef.current = false;

          tooltipProps?.afterHide?.(args);
        }}
        afterShow={(args) => {
          isTooltipShownRef.current = true;

          tooltipProps?.afterShow?.(args);
        }}
        id={tooltipIDRef.current}
      />
    </>
  );
}
