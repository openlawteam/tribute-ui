import {useEffect, useState} from 'react';
import {toWei} from 'web3-utils';
import BigNumber from 'bignumber.js';

import {AsyncStatus} from '../../../util/types';
import {ENVIRONMENT} from '../../../config';
import {useAbortController} from '../../../hooks';

type GasStationResponse = {
  average: number;
  avgWait: number;
  block_time: number;
  blockNum: number;
  fast: number;
  fastest: number;
  fastestWait: number;
  fastWait: number;
  gasPriceRange: Record<string, number>;
  safeLow: number;
  safeLowWait: number;
  speed: number;
};

type GasPrices = {
  average: string | undefined;
  fast: string | undefined;
  fastest: string | undefined;
  safeLow: string | undefined;
};

type UseETHGasPriceReturn = GasPrices & {
  gasPriceError: Error | undefined;
  gasPriceStatus: AsyncStatus;
};

const URL = 'https://ethgasstation.info/json/ethgasAPI.json';

/**
 * To prepare the provided ETHGasStation values for conversion from Gwei->wei,
 * first divide by `10`, per the API docs.
 *
 * @see https://docs.ethgasstation.info/gas-price#gas-price
 */
function convertGasToWEI(gasStationPrice: number) {
  const gasPriceToWEI: string = toWei(
    new BigNumber((gasStationPrice / 10).toFixed(4)).toString(),
    'Gwei'
  );

  return gasPriceToWEI;
}

const INITIAL_GAS_PRICES: GasPrices = {
  average: undefined,
  fast: undefined,
  fastest: undefined,
  safeLow: undefined,
};

/**
 * useETHGasPrice
 *
 * Returns the latest mainnet gas prices, converted to WEI string from ETHGasStation.
 *
 * @returns {UseETHGasPriceReturn}
 * @see https://ethgasstation.info/json/ethgasAPI.json
 */
export function useETHGasPrice(props?: {
  ignoreEnvironment?: boolean;
}): UseETHGasPriceReturn {
  const {ignoreEnvironment = false} = props || {};

  /**
   * State
   */

  const [gasPrices, setGasPrices] = useState<GasPrices>(INITIAL_GAS_PRICES);
  const [gasPriceError, setGasPriceError] = useState<Error>();

  const [gasPriceStatus, setGasPriceStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

  /**
   * Our hooks
   */

  const {abortController, isMountedRef} = useAbortController();

  /**
   * Variables
   */

  /**
   * Sometimes using mainnet gas prices for testnets won't work well with wallets.
   */
  const shouldExitIfNotProduction: boolean =
    ignoreEnvironment === false && ENVIRONMENT !== 'production';

  /**
   * Effects
   */

  useEffect(() => {
    if (!abortController?.signal) return;
    if (shouldExitIfNotProduction) return;

    setGasPriceError(undefined);
    setGasPriceStatus(AsyncStatus.PENDING);

    fetch(URL, {signal: abortController.signal})
      .then((response) => {
        if (!isMountedRef.current) return;

        if (!response.ok) {
          throw new Error(
            'Something went wrong while getting the latest gas price.'
          );
        }

        setGasPriceStatus(AsyncStatus.FULFILLED);

        return response.json();
      })
      .then((jsonResponse: GasStationResponse) => {
        if (!isMountedRef.current) return;

        const {average, fast, fastest, safeLow} = jsonResponse;

        setGasPrices({
          average: convertGasToWEI(average),
          fast: convertGasToWEI(fast),
          fastest: convertGasToWEI(fastest),
          safeLow: convertGasToWEI(safeLow),
        });
      })
      .catch((error) => {
        if (!isMountedRef.current) return;

        setGasPriceError(error);
        setGasPrices(INITIAL_GAS_PRICES);
        setGasPriceStatus(AsyncStatus.REJECTED);
      });

    return () => {
      abortController.abort();
    };
  }, [abortController, isMountedRef, shouldExitIfNotProduction]);

  /**
   * Result
   */

  return {...gasPrices, gasPriceError, gasPriceStatus};
}
