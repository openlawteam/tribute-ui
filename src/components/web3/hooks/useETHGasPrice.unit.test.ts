import {act, renderHook} from '@testing-library/react-hooks';

import {AsyncStatus} from '../../../util/types';
import {ethGasStationResponse} from '../../../test/restResponses';
import {rest, server} from '../../../test/server';
import {useETHGasPrice} from './useETHGasPrice';
import {ENVIRONMENT} from '../../../config';

describe('useETHGasPrice unit tests', () => {
  test('should return correct data', async () => {
    await act(async () => {
      const {result, waitForValueToChange} = await renderHook(() =>
        useETHGasPrice({ignoreEnvironment: true})
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
      const {result, waitForValueToChange} = await renderHook(() =>
        useETHGasPrice({ignoreEnvironment: true})
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
      const {result, waitForNextUpdate} = await renderHook(() =>
        useETHGasPrice({ignoreEnvironment: false})
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

      await waitForNextUpdate();

      // Assert exit since the environment does not equal `"production"``
      expect(ENVIRONMENT).toBe('localhost');

      expect(result.current).toStrictEqual({
        average: undefined,
        fast: undefined,
        fastest: undefined,
        gasPriceError: undefined,
        gasPriceStatus: AsyncStatus.STANDBY,
        safeLow: undefined,
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
      const {result, waitForValueToChange} = await renderHook(() =>
        useETHGasPrice({ignoreEnvironment: true})
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
