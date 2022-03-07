import {toWei} from 'web3-utils';
import {useCallback, useEffect, useState} from 'react';
import BigNumber from 'bignumber.js';

import {AsyncStatus} from '../../../util/types';
import {ENVIRONMENT} from '../../../config';
import {useAbortController} from '../../../hooks';
import {useWeb3Modal} from './useWeb3Modal';

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
  /**
   * The network is EIP-1559 compatible and we do not want to use the gas price.
   *
   * The gas station prices can still be used for EIP-1559.
   * For example, to set `maxFeePerGas` (base fee plus tip).
   */
  noRunIfEIP1559?: boolean;
}): UseETHGasPriceReturn {
  const {ignoreEnvironment = false, noRunIfEIP1559 = false} = props || {};

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

  const {web3Instance} = useWeb3Modal();
  const {abortController, isMountedRef} = useAbortController();

  /**
   * Variables
   */

  // Sometimes using mainnet gas prices for testnets won't work well with wallets.
  const shouldExitIfNotProduction: boolean =
    ignoreEnvironment === false && ENVIRONMENT !== 'production';

  /**
   * Cached callbacks
   */

  const handleGetGasPricesCached = useCallback(handleGetGasPrices, [
    abortController,
    isMountedRef,
    noRunIfEIP1559,
    shouldExitIfNotProduction,
    web3Instance,
  ]);

  /**
   * Effects
   */

  useEffect(() => {
    handleGetGasPricesCached();

    return function cleanup() {
      abortController?.abort();
    };
  }, [abortController, handleGetGasPricesCached]);

  /**
   * Functions
   */

  async function handleGetGasPrices() {
    if (!abortController?.signal) return;

    if (!web3Instance) return;

    setGasPriceError(undefined);

    if (shouldExitIfNotProduction) {
      setGasPriceStatus(AsyncStatus.FULFILLED);

      return;
    }

    if (noRunIfEIP1559) {
      // Check EIP-1559 support
      const {isEIP1559Compatible} = await import(
        '../helpers/isEIP1559Compatible'
      );

      if (await isEIP1559Compatible(web3Instance)) {
        setGasPriceStatus(AsyncStatus.FULFILLED);

        return;
      }
    }

    setGasPriceStatus(AsyncStatus.PENDING);

    try {
      const response = await fetch(URL, {signal: abortController.signal});

      if (!response.ok) {
        throw new Error(
          'Something went wrong while getting the latest gas price.'
        );
      }

      const responseJSON: GasStationResponse = await response.json();

      if (!isMountedRef.current) return;

      const {average, fast, fastest, safeLow} = responseJSON;

      setGasPrices({
        average: convertGasToWEI(average),
        fast: convertGasToWEI(fast),
        fastest: convertGasToWEI(fastest),
        safeLow: convertGasToWEI(safeLow),
      });

      setGasPriceStatus(AsyncStatus.FULFILLED);
    } catch (error) {
      if (!isMountedRef.current) return;

      const e = error as Error;

      setGasPriceError(e);
      setGasPrices(INITIAL_GAS_PRICES);
      setGasPriceStatus(AsyncStatus.REJECTED);
    }
  }

  /**
   * Result
   */

  return {...gasPrices, gasPriceError, gasPriceStatus};
}
