import {act, renderHook} from '@testing-library/react-hooks';

import {
  ethGetBlockByNumberResponse,
  ethGetBlockByNumberResponseLegacy,
} from '../../../test/web3Responses/fixtures';
import {AsyncStatus} from '../../../util/types';
import {ENVIRONMENT} from '../../../config';
import {ethGasStationResponse} from '../../../test/restResponses';
import {FakeHttpProvider} from '../../../test/helpers';
import {rest, server} from '../../../test/server';
import {useETHGasPrice} from './useETHGasPrice';
import Wrapper from '../../../test/Wrapper';

describe('useETHGasPrice unit tests', () => {
  test('should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useETHGasPrice({ignoreEnvironment: true}),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.STANDBY,
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.gasPriceStatus);

      // Assert pending
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.PENDING,
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.fast);

      // Assert data
      expect(result.current).toStrictEqual({
        average: '7500000000',
        fast: '13000000000',
        fastest: '16000000000',
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.FULFILLED,
        safeLow: '7500000000',
      });
    });
  });

  test('should return correct data for decimal amounts', async () => {
    server.use(
      rest.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
        (_req, res, ctx) =>
          /**
           * This value in JS will produce `13.008000000000001` which is
           * too many decimals for `BigNumber` to convert. We want to make sure
           * our implementation is handling this case.
           */
          res(ctx.json({...ethGasStationResponse, fast: 130.08}))
      )
    );

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useETHGasPrice({ignoreEnvironment: true}),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: 'STANDBY',
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.gasPriceStatus);

      // Assert pending
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.PENDING,
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.fast);

      // Assert data
      expect(result.current).toStrictEqual({
        average: '7500000000',
        fast: '13008000000',
        fastest: '16000000000',
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.FULFILLED,
        safeLow: '7500000000',
      });
    });
  });

  test('should return correct data when using prop `ignoreEnvironment: false`', async () => {
    await act(async () => {
      const {result} = await renderHook(
        () => useETHGasPrice({ignoreEnvironment: false}),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.STANDBY,
        safeLow: undefined,
      });

      // Wait for a bit as it's easy to get false-positives when nothing changes
      await new Promise((r) => setTimeout(r, 1000));

      // Assert exit since the environment does not equal `"production"``
      expect(ENVIRONMENT).toBe('localhost');

      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.FULFILLED,
        safeLow: undefined,
      });
    });
  });

  test('should return correct data when using prop `noRunIfEIP1559: true` and has EIP-1559 support', async () => {
    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result} = await renderHook(
        () => useETHGasPrice({noRunIfEIP1559: true, ignoreEnvironment: true}),
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

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.STANDBY,
        safeLow: undefined,
      });

      mockWeb3Provider.injectResult(ethGetBlockByNumberResponse);

      // Wait for a bit as it's easy to get false-positives when nothing changes
      await new Promise((r) => setTimeout(r, 1000));

      // Assert pending state
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.FULFILLED,
        safeLow: undefined,
      });
    });
  });

  test('should return correct data when using prop `noRunIfEIP1559: true` and does not have EIP-1559 support', async () => {
    let mockWeb3Provider: FakeHttpProvider;

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useETHGasPrice({noRunIfEIP1559: true, ignoreEnvironment: true}),
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

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.STANDBY,
        safeLow: undefined,
      });

      mockWeb3Provider.injectResult(ethGetBlockByNumberResponseLegacy);

      await waitForValueToChange(() => result.current.gasPriceStatus);

      // Assert pending state
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.PENDING,
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current.gasPriceStatus);

      // Assert fulfilled state
      expect(result.current).toEqual({
        average: '7500000000',
        fast: '13000000000',
        fastest: '16000000000',
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.FULFILLED,
        safeLow: '7500000000',
      });
    });
  });

  test('should return correct data when network error', async () => {
    // Return an error response from the server
    server.use(
      rest.get(
        'https://ethgasstation.info/json/ethgasAPI.json',
        (_req, res, ctx) => res(ctx.status(500))
      )
    );

    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(
        () => useETHGasPrice({ignoreEnvironment: true}),
        {
          wrapper: Wrapper,
          initialProps: {
            useInit: true,
            useWallet: true,
          },
        }
      );

      // Assert initial data
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: 'STANDBY',
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.gasPriceStatus);

      // Assert pending
      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.PENDING,
        safeLow: undefined,
      });

      await waitForValueToChange(() => result.current?.gasPriceStatus);

      // Assert data
      expect(result.current).toMatchObject({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceStatus: AsyncStatus.REJECTED,
        safeLow: undefined,
      });

      expect(result.current.gasPriceError).toBeInstanceOf(Error);
    });
  });
});
