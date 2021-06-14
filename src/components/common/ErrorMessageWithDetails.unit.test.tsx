import {render, screen} from '@testing-library/react';

import ErrorMessageWithDetails from './ErrorMessageWithDetails';

class WalletError extends Error {
  code: number | undefined = undefined;

  constructor(message: string, code: number | undefined) {
    super();

    this.message = message;
    this.code = code;
  }
}

describe('ErrorMessageWithDetails unit tests', () => {
  test('should return error message with details', () => {
    const {rerender} = render(
      <ErrorMessageWithDetails
        error={new Error('Some exotic error.')}
        renderText="Error!"
      />
    );

    expect(screen.getByText(/^error!$/i)).toBeInTheDocument();
    expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Some exotic error\.$/i)).toBeInTheDocument();

    // Using `detailsProps`
    rerender(
      <ErrorMessageWithDetails
        error={new Error('Some exotic error.')}
        renderText="Error!"
        detailsProps={{open: false}}
      />
    );

    expect(screen.getByText(/^error!$/i)).toBeInTheDocument();
    expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Some exotic error\.$/i)).toBeInTheDocument();
  });

  test('should return `null` if no `error`', () => {
    render(<ErrorMessageWithDetails error={undefined} renderText="Error!" />);

    expect(() => screen.getByText(/^error!$/i)).toThrow();
    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(() => screen.getByText(/^Some exotic error\.$/i)).toThrow();
  });

  test('should return error message with details when `renderText` is function', () => {
    render(
      <ErrorMessageWithDetails
        error={new Error('The most exotic error!')}
        renderText={() => (
          <span data-testid="exotic-error">Something went wrong</span>
        )}
      />
    );

    expect(screen.getByText(/^something went wrong$/i)).toBeInTheDocument();
    expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    expect(screen.getByText(/^the most exotic error!$/i)).toBeInTheDocument();
    expect(screen.getByTestId('exotic-error')).toBeInTheDocument();
  });

  test('should return error message with details when `error` is function', () => {
    render(
      <ErrorMessageWithDetails
        error={() => (
          <span data-testid="exotic-error">The most exotic error!</span>
        )}
        renderText="Something went wrong"
      />
    );

    expect(screen.getByText(/^something went wrong$/i)).toBeInTheDocument();
    expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    expect(screen.getByText(/^the most exotic error!$/i)).toBeInTheDocument();
    expect(screen.getByTestId('exotic-error')).toBeInTheDocument();
  });

  test('should return error message with details when both `error` and `renderText` are functions', () => {
    render(
      <ErrorMessageWithDetails
        error={() => (
          <span data-testid="exotic-error-1">The most exotic error!</span>
        )}
        renderText={() => (
          <span data-testid="exotic-error-2">Another exotic error!</span>
        )}
      />
    );

    expect(screen.getByText(/^another exotic error!$/i)).toBeInTheDocument();
    expect(screen.getByText(/^details$/i)).toBeInTheDocument();
    expect(screen.getByText(/^the most exotic error!$/i)).toBeInTheDocument();
    expect(screen.getByTestId('exotic-error-1')).toBeInTheDocument();
    expect(screen.getByTestId('exotic-error-2')).toBeInTheDocument();
  });

  test('should return `null` if 4001 error code (user rejected wallet tx)', () => {
    render(
      <ErrorMessageWithDetails
        error={new WalletError('User rejected the transaction', 4001)}
        renderText="Error!"
      />
    );

    expect(() => screen.getByText(/^error!$/i)).toThrow();
    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(() => screen.getByText(/^Some exotic error\.$/i)).toThrow();
  });

  test('should return `null` if `error.message` matches user rejected wallet tx', () => {
    const {rerender} = render(
      <ErrorMessageWithDetails
        error={new Error('the user rejected the request')}
        renderText="Error!"
      />
    );

    expect(() => screen.getByText(/^error!$/i)).toThrow();
    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(() => screen.getByText(/^Some exotic error\.$/i)).toThrow();

    rerender(
      <ErrorMessageWithDetails
        error={new Error('user rejected the request')}
        renderText="Error!"
      />
    );

    expect(() => screen.getByText(/^error!$/i)).toThrow();
    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(() => screen.getByText(/^Some exotic error\.$/i)).toThrow();

    rerender(
      <ErrorMessageWithDetails
        error={new Error('user rejected request')}
        renderText="Error!"
      />
    );

    expect(() => screen.getByText(/^error!$/i)).toThrow();
    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(() => screen.getByText(/^Some exotic error\.$/i)).toThrow();
  });

  test('should return only error message if `error.message` and `renderText: string` value equal', () => {
    render(
      <ErrorMessageWithDetails
        error={new Error('Some exotic error.')}
        renderText="Some exotic error."
      />
    );

    expect(() => screen.getByText(/^details$/i)).toThrow();
    expect(screen.getByText(/^Some exotic error\.$/i)).toBeInTheDocument();
  });
});
