// see: http://reactcommunity.org/react-transition-group/transition
import React from 'react';
import {Transition} from 'react-transition-group';

type FadeInProps = {
  children: React.ReactNode;
  duration?: number;
  /**
   * Defaults to `true`
   */
  show?: boolean;
};

const DEFAULT_DURATION = 300;

const defaultStyle = (props: FadeInProps) => ({
  transition: `opacity ${
    props.duration || 300
  }ms cubic-bezier(0, 0.69, 0.32, 0.64)`,
  opacity: 0,
});

const transitionStyles: Record<string, any> = {
  entering: {opacity: 0},
  entered: {opacity: 1},
  exiting: {opacity: 0},
  exited: {opacity: 0},
};

export default function FadeIn(props: FadeInProps) {
  return (
    <Transition
      appear
      in={props.show !== undefined ? props.show : true}
      timeout={props.duration || DEFAULT_DURATION}>
      {(transition) => (
        <div
          style={{
            ...defaultStyle(props),
            ...transitionStyles[transition],
          }}>
          {props.children}
        </div>
      )}
    </Transition>
  );
}
