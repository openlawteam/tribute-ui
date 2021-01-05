import React from 'react';

import FadeIn from './FadeIn';

type InputErrorProps = {
  error: string;
};

export default function InputError(
  props: InputErrorProps & React.HtmlHTMLAttributes<HTMLParagraphElement>
) {
  const {error, ...restProps} = props;

  return (
    <>
      {error && (
        <FadeIn>
          <p
            {...restProps}
            className={`error-message ${restProps.className || ''}`}>
            {error}
          </p>
        </FadeIn>
      )}
    </>
  );
}
