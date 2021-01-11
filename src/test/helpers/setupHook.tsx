import {render} from '@testing-library/react';

import Wrapper, {WrapperReturnProps} from '../Wrapper';

type SetupHookReturn = {
  result: any;
} & WrapperReturnProps;

/**
 * setupHook
 *
 * Sets up testing a custom hook with our `<Wrapper />`.
 * If you don't need the wrapper component (i.e. no Redux state being used)
 * then you should be able to use `react-hooks-testing-library` (installed).
 *
 * @see https://github.com/testing-library/react-hooks-testing-library
 * @see https://kentcdodds.com/blog/how-to-test-custom-react-hooks
 *
 * @param {(p?: any) => any} hook
 * @param {?any} hookArgs
 * @param {?Parameters<typeof Wrapper>[0]} wrapperProps
 * @returns {any}
 */
export function setupHook({
  hook,
  hookArgs,
  wrapperProps,
}: {
  hook?: (p?: any) => any;
  hookArgs?: any;
  wrapperProps?: Parameters<typeof Wrapper>[0];
}): SetupHookReturn {
  let returnVal: Partial<SetupHookReturn> = {};

  function TestComponent() {
    returnVal = {...returnVal, result: hook && hook(...hookArgs)};

    return null;
  }

  render(
    <Wrapper
      {...wrapperProps}
      render={(p) => {
        returnVal = {...returnVal, ...p};

        return (
          <>
            <TestComponent />

            {wrapperProps?.render && wrapperProps.render(p)}
          </>
        );
      }}
    />
  );

  return returnVal as SetupHookReturn;
}
