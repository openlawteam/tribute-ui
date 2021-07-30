import {act, renderHook} from '@testing-library/react-hooks';
import {waitFor} from '@testing-library/react';
import Web3 from 'web3';

import {AsyncStatus} from '../util/types';
import {ContractDAOConfigKeys} from '../components/web3/types';
import {FakeHttpProvider} from '../test/helpers';
import {useDaoConfigurations} from './useDaoConfigurations';
import Wrapper from '../test/Wrapper';

describe('useDaoConfigurations unit tests', () => {
  test('should return correct data', async () => {
    let mockWeb3Provider: FakeHttpProvider;
    let web3Instance: Web3;

    await act(async () => {
      const configKeys = [
        ContractDAOConfigKeys.offchainVotingVotingPeriod,
        ContractDAOConfigKeys.offchainVotingGracePeriod,
      ];

      const {result, waitForValueToChange} = await renderHook(
        () => useDaoConfigurations(configKeys),
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

      // Mock `multicall`
      mockWeb3Provider.injectResult(
        web3Instance.eth.abi.encodeParameters(
          ['uint256', 'bytes[]'],
          [
            0,
            [
              // For `getConfiguration` call
              web3Instance.eth.abi.encodeParameter('uint256', 60),
              // For `getConfiguration` call
              web3Instance.eth.abi.encodeParameter('uint256', 120),
            ],
          ]
        )
      );

      // Assert initial
      expect(result.current.daoConfigurations).toStrictEqual([]);
      expect(result.current.daoConfigurationsError).toBe(undefined);
      expect(result.current.daoConfigurationsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.daoConfigurationsStatus);

      // Assert pending
      expect(result.current.daoConfigurationsStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.daoConfigurations).toStrictEqual([]);
      expect(result.current.daoConfigurationsError).toBe(undefined);

      await waitForValueToChange(() => result.current.daoConfigurations);

      // Assert fulfilled
      expect(result.current.daoConfigurations).toStrictEqual(['60', '120']);
      expect(result.current.daoConfigurationsError).toBe(undefined);
      expect(result.current.daoConfigurationsStatus).toBe(
        AsyncStatus.FULFILLED
      );
    });
  });

  test('should return correct data on error', async () => {
    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const configKeys = [
        ContractDAOConfigKeys.offchainVotingVotingPeriod,
        ContractDAOConfigKeys.offchainVotingGracePeriod,
      ];

      const {result, waitForValueToChange} = await renderHook(
        () => useDaoConfigurations(configKeys),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
            getProps: (p) => {
              mockWeb3Provider = p.mockWeb3Provider;
            },
          },
        }
      );

      /**
       * @note Think we need two errors for this to work properly, because of
       *   mocked calls in the Wrapper. `useDaoConfigurations` unmounts too soon
       *   if only one `injectError` is used, because it causes a failure higher in the
       *   component tree, presumably?
       */
      mockWeb3Provider.injectError({code: 1234, message: 'Some bad error!'});
      mockWeb3Provider.injectError({code: 1234, message: 'Some bad error!'});

      // Assert initial
      expect(result.current.daoConfigurations).toStrictEqual([]);
      expect(result.current.daoConfigurationsError).toBe(undefined);
      expect(result.current.daoConfigurationsStatus).toBe(AsyncStatus.STANDBY);

      await waitForValueToChange(() => result.current.daoConfigurationsStatus);

      // Assert pending
      expect(result.current.daoConfigurationsStatus).toBe(AsyncStatus.PENDING);
      expect(result.current.daoConfigurations).toStrictEqual([]);
      expect(result.current.daoConfigurationsError).toBe(undefined);

      await waitForValueToChange(() => result.current.daoConfigurationsError);

      // Assert rejected
      expect(result.current.daoConfigurationsStatus).toBe(AsyncStatus.REJECTED);
      expect(result.current.daoConfigurations).toStrictEqual([]);
      expect(result.current.daoConfigurationsError).toStrictEqual({
        code: 1234,
        message: 'Some bad error!',
      });
    });
  });
});
