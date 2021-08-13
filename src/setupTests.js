const {act} = require('@testing-library/react-hooks');
const {queryClient} = require('./test/Wrapper');

// Adds jest-dom's custom assertions
require('@testing-library/jest-dom/extend-expect');
const path = require('path');

/**
 * Require any env vars for testing environment
 * as early as possible
 */
const {parsed: parsedEnv} = require('dotenv').config({
  path: `${path.resolve(process.cwd(), 'src/test/.env')}`,
});

// @note Merge the env vars, as the root `.env` gets loaded first, somehow in the test env (maybe CRA).
process.env = {
  ...process.env,
  ...parsedEnv,
};

const {server} = require('./test/server');

/**
 * setupTests.js
 *
 * For Create React App + Jest. This is a helper file to be used in place
 * of using `jest.config.js` with `setupFilesAfterEnv`.
 *
 * From the CRA docs:
 *
 *   "If your app uses a browser API that you need to mock in your tests
 *    or if you need a global setup before running your tests,
 *    add a `src/setupTests.js` to your project. It will be automatically executed
 *    before running your tests."
 *
 * @see https://create-react-app.dev/docs/running-tests/#initializing-test-environment
 */

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });

  /**
   * Mock window.matchMedia which is not supported in JSDOM.
   *
   * @see https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
   */
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });

  /**
   * Mock window.scrollTo which is not supported in JSDOM.
   */
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => {},
  });
});
// If you need to add a handler after calling setupServer for some specific test
// this will remove that handler for the rest of them
// (which is important for test isolation):
afterEach(() => {
  server.resetHandlers();
  // clear global cache
  act(() => queryClient.clear());
});
afterAll(() => server.close());
