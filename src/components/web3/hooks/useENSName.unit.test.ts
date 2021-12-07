import {act, renderHook} from '@testing-library/react-hooks';
import Web3 from 'web3';

import {DEFAULT_ETH_ADDRESS, FakeHttpProvider} from '../../../test/helpers';
import {REVERSE_RECORDS_ADDRESS} from '../helpers/reverseResolveENS';
import {useENSName} from './useENSName';
import Wrapper from '../../../test/Wrapper';

describe('useENSName unit tests', () => {
  test('should return resolved addresses', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useENSName(web3Instance),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
        }
      );

      // Assert initial state
      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBeInstanceOf(Function);

      // Mock the `ReverseRecords.getNames` response
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('string[]', [
          'someone.eth',
          'cat.eth',
        ])
      );

      result.current[1]([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS]);

      await waitForValueToChange(() => result.current[0]);

      // Assert initial state
      expect(result.current[0]).toEqual(['someone.eth', 'cat.eth']);
      expect(result.current[1]).toBeInstanceOf(Function);

      // Cleanup
      delete REVERSE_RECORDS_ADDRESS[1337];
    });
  });

  test('should return provided addresses if lookup fails', async () => {
    // Set up `ReverseRecords` contract address for testing
    REVERSE_RECORDS_ADDRESS[1337] = DEFAULT_ETH_ADDRESS;

    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useENSName(web3Instance),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
              web3Instance = p.web3Instance;
            },
          },
        }
      );

      // Assert initial state
      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBeInstanceOf(Function);

      // Mock the `ReverseRecords.getNames` response
      mockWeb3Provider.injectError({message: 'Some bad error', code: 1234});

      // Mock the `ReverseRecords.getNames` response
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameter('string[]', [
          'someone.eth',
          'cat.eth',
        ])
      );

      result.current[1]([DEFAULT_ETH_ADDRESS, DEFAULT_ETH_ADDRESS]);

      await waitForValueToChange(() => result.current[0]);

      // Assert initial state
      expect(result.current[0]).toEqual([
        DEFAULT_ETH_ADDRESS,
        DEFAULT_ETH_ADDRESS,
      ]);

      expect(result.current[1]).toBeInstanceOf(Function);

      // Cleanup
      delete REVERSE_RECORDS_ADDRESS[1337];
    });
  });
});
