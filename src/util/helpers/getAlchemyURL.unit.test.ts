import {CHAINS, CHAIN_NAME} from '../../config';
import {getAlchemyURL} from '.';

const API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

describe('getAlchemyURL unit tests', () => {
  test('should return correct URLs', () => {
    expect(getAlchemyURL(CHAINS.GOERLI)).toBe(
      `https://eth-${CHAIN_NAME[CHAINS.GOERLI]}.alchemyapi.io/v2/${API_KEY}`
    );

    expect(getAlchemyURL(CHAINS.KOVAN)).toBe(
      `https://eth-${CHAIN_NAME[CHAINS.KOVAN]}.alchemyapi.io/v2/${API_KEY}`
    );

    expect(getAlchemyURL(CHAINS.MAINNET)).toBe(
      `https://eth-${CHAIN_NAME[CHAINS.MAINNET]}.alchemyapi.io/v2/${API_KEY}`
    );

    expect(getAlchemyURL(CHAINS.RINKEBY)).toBe(
      `https://eth-${CHAIN_NAME[CHAINS.RINKEBY]}.alchemyapi.io/v2/${API_KEY}`
    );

    expect(getAlchemyURL(CHAINS.ROPSTEN)).toBe(
      `https://eth-${CHAIN_NAME[CHAINS.ROPSTEN]}.alchemyapi.io/v2/${API_KEY}`
    );
  });

  test('should return `undefined`', () => {
    expect(getAlchemyURL(CHAINS.GANACHE)).toBe(undefined);
    expect(getAlchemyURL(CHAINS.HARMONY_MAIN)).toBe(undefined);
    expect(getAlchemyURL(CHAINS.HARMONY_TEST)).toBe(undefined);

    // Set env var to `undefined`
    process.env.REACT_APP_ALCHEMY_API_KEY = undefined;

    expect(getAlchemyURL(CHAINS.MAINNET)).toBe(undefined);

    // Cleanup
    process.env.REACT_APP_ALCHEMY_API_KEY = API_KEY;
  });
});
