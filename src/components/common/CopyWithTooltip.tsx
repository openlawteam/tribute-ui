import {useEffect, useRef} from 'react';
import {v4 as uuidv4} from 'uuid';
import ReactTooltip from 'react-tooltip';
import useClipboard from 'react-use-clipboard';

type CopyWithTooltipProps = {
  /**
   * How long to wait before resetting `isCopied` in milliseconds. Defaults to `3000`.
   */
  copySuccessResetMs?: number;
  render: (p: CopyWithTooltipRenderProps) => JSX.Element;
  textToCopy: string;
  /**
   * Props for `react-tooltip`
   */
  tooltipProps?: ReactTooltip['props'];
};

type CopyWithTooltipRenderProps = {
  /**
   * Ref for attaching to the rendered element's `ref` prop
   */
  elementRef: React.RefObject<any>;
  /**
   * Whether or not a copy event has completed. Can be reset using `copySuccessResetMs`.
   */
  isCopied: boolean;
  /**
   * Callback to trigger a copy event
   */
  setCopied: ReturnType<typeof useClipboard>[1];
  /**
   * ID for attaching to the rendered element's `data-for` prop
   */
  tooltipID: string;
};

const DELAY_TOOLTIP_SHOW_MS: number = 200;

export function CopyWithTooltip(props: CopyWithTooltipProps): JSX.Element {
  const {
    copySuccessResetMs = 3000,
    render,
    textToCopy = '',
    tooltipProps,
  } = props;

  /**
   * Their hooks
   */

  const [isCopied, setCopied] = useClipboard(textToCopy, {
    // `isCopied` will go back to `false` after 3 seconds.
    successDuration: copySuccessResetMs,
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
        delayShow={DELAY_TOOLTIP_SHOW_MS}
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
