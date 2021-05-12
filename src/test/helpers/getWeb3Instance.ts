import Web3 from 'web3';
import {provider as Web3Provider} from 'web3-core/types';

import {FakeHttpProvider} from './';

/**
 * getWeb3Instance
 *
 * Provides a new Web3 instance and its provider for injecting results, errors, etc.
 *
 * @returns {{ web3: Web3; mockWeb3Provider: FakeHttpProvider; }}
 */
export function getWeb3Instance(): {
  web3: Web3;
  mockWeb3Provider: FakeHttpProvider;
} {
  const mockWeb3Provider: FakeHttpProvider = new FakeHttpProvider();

  return {
    mockWeb3Provider,
    web3: new Web3(mockWeb3Provider as unknown as Web3Provider),
  };
}
