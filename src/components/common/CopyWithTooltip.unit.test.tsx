import {act, render, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {CopyWithTooltip} from './CopyWithTooltip';

describe('CopyWithTooltip unit tests', () => {
  const promptOriginal = global.prompt;

  global.prompt = (() => true) as any;

  afterAll(() => {
    global.prompt = promptOriginal;
  });

  test('should render tooltip on hover', async () => {
    const {getByRole, getByText} = render(
      <CopyWithTooltip
        render={({elementRef, isCopied, setCopied, tooltipID}) => (
          <button
            data-for={tooltipID}
            data-tip={isCopied ? 'copied!' : 'copy'}
            onClick={setCopied}
            ref={elementRef}>
            Click me
          </button>
        )}
        textToCopy="test"
      />
    );

    userEvent.hover(getByRole('button', {name: /click me/i}));

    await waitFor(() => {
      expect(getByText(/copy/i)).toBeInTheDocument();
    });
  });

  test('should render correct text after copy', async () => {
    await act(async () => {
      const {getByRole, getByText} = render(
        <CopyWithTooltip
          render={({elementRef, isCopied, setCopied, tooltipID}) => (
            <button
              data-for={tooltipID}
              data-tip={isCopied ? 'copied!' : 'copy'}
              onClick={setCopied}
              ref={elementRef}>
              Click me
            </button>
          )}
          textToCopy="test"
        />
      );

      userEvent.click(getByRole('button', {name: /click me/i}));

      // Assert tooltip text
      await waitFor(() => {
        expect(getByText(/copied!/i)).toBeInTheDocument();
      });

      // Assert tooltip text reset
      await waitFor(
        () => {
          expect(getByText(/copy/i)).toBeInTheDocument();
        },
        {timeout: 5000}
      );
    });
  });

  test('should render correct text after copy using `copySuccessResetMs`', async () => {
    await act(async () => {
      const {getByRole, getByText} = render(
        <CopyWithTooltip
          copySuccessResetMs={1500}
          render={({elementRef, isCopied, setCopied, tooltipID}) => (
            <button
              data-for={tooltipID}
              data-tip={isCopied ? 'copied!' : 'copy'}
              onClick={setCopied}
              ref={elementRef}>
              Click me
            </button>
          )}
          textToCopy="test"
        />
      );

      userEvent.click(getByRole('button', {name: /click me/i}));

      // Assert tooltip text
      await waitFor(() => {
        expect(getByText(/copied!/i)).toBeInTheDocument();
      });

      // Assert tooltip text reset
      await waitFor(
        () => {
          expect(getByText(/copy/i)).toBeInTheDocument();
        },
        {timeout: 2500}
      );
    });
  });
});
