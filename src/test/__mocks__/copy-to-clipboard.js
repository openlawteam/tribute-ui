/**
 * For `react-use-clipboard`:
 *
 * Assume that the `copy-to-clipboard` package will work as expected. This is needed because Jest
 * can't simulate storing a value in a clipboard.
 *
 * @see https://www.npmjs.com/package/copy-to-clipboard
 * @see https://github.com/danoc/react-use-clipboard/tree/master/__mocks__
 */
module.exports = (text) => {
  return !!text;
};
