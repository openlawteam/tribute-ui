import React, {useEffect, useState} from 'react';

interface IProps {
  // Show spinner after some time has elapsed.
  // Prevents the "sudden spinner" UI/UX no-no.
  // Esp. if we could have cached data.
  showAfterMs?: number;
  text?: string;
  textProps?: {[key: string]: any};
}

function Spinner(props: Partial<IProps>) {
  return <div className="loader" {...props} />;
}

const Loader = (
  props: IProps & React.PropsWithoutRef<JSX.IntrinsicElements['div']>
) => {
  const {showAfterMs, text, textProps, ...loaderProps} = props;
  const [showLoaderAfterMs, setShowLoaderAfterMs] = useState<boolean>(false);

  useEffect(() => {
    /* 200ms is approx. the time a user will notice a stalled, blank screen */
    const timeoutId =
      showAfterMs && setTimeout(() => setShowLoaderAfterMs(true), showAfterMs);

    return function cleanup() {
      timeoutId && clearTimeout(timeoutId);
    };
  }, [showAfterMs]);

  return (!showAfterMs || (showAfterMs && showLoaderAfterMs)) && props.text ? (
    <div className="loader-container">
      <Spinner {...loaderProps} />
      <span className="loader__text" {...textProps}>
        {text}
      </span>
    </div>
  ) : (!showAfterMs || (showAfterMs && showLoaderAfterMs)) && !props.text ? (
    <Spinner {...loaderProps} />
  ) : null;
};

export default Loader;
