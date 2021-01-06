import React, {useState, useEffect} from 'react';

import {chooseRandom} from '../../util/helpers';

type CycleMessageProps = {
  /**
   * Use the first item as the default.
   */
  useFirstItemStart?: boolean;
  /**
   * What is the interval of cycling the message?
   */
  intervalMs: number;
  /**
   * Provide multiple strings to cycle through.
   */
  messages: string[];
  /**
   * Render a React Element.
   * activeMessage is passed in.
   */
  render: (m: string) => React.ReactElement;
};

export default function CycleMessage(props: CycleMessageProps) {
  const {intervalMs, messages, useFirstItemStart} = props;

  // Default item at start.
  const INITIAL_ITEM = useFirstItemStart
    ? messages[0]
    : chooseRandom<string>(messages);

  const [activeMessage, setActiveMessage] = useState<string>(INITIAL_ITEM);

  useEffect(() => {
    const intervalId = setInterval(
      () =>
        setActiveMessage((prevMessage) =>
          chooseRandom<string>(messages, prevMessage)
        ),
      intervalMs
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs, messages]);

  return props.render(activeMessage);
}
