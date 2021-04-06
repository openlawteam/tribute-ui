import {useEffect, useState, useRef} from 'react';
import {ENVIRONMENT} from '../../../config';

type GasStationResponse = {
  average: number;
  avgWait: number;
  block_time: number;
  blockNum: number;
  fast: number;
  fastest: number;
  fastestWait: number;
  fastWait: number;
  safeLow: number;
  safeLowWait: number;
  speed: number;
  standard: number;
};

type GasPrices = {
  average?: string;
  fast: string;
  fastest: string;
  safeLow: string;
  standard?: string;
};

const REQUEST_TIMEOUT_MS = 5000;
const URL = 'https://ethgasstation.info/json/ethgasAPI.json';
const SECONDARY_URL = 'https://www.etherchain.org/api/gasPriceOracle';

/**
 * useETHGasPrice
 *
 * Returns the latest mainnet gas prices, converted to WEI string.
 * If ETHGasStation is not returning quick enough (or fails), it tries etherchain's
 * gasPriceOracle API endpoint.
 *
 * @returns {GasPrices}
 */
export function useETHGasPrice() {
  /**
   * State
   */

  const [gasURL, setGasURL] = useState<string>(URL);
  const [gasPrices, setGasPrices] = useState<GasPrices>();

  const isMounted = useRef<boolean>();

  useEffect(() => {
    /**
     * If the environment is not production, then exit.
     * Sometimes using mainnet gas prices for Rinkeby won't work well with wallets.
     */
    if (ENVIRONMENT !== 'production') return;

    isMounted.current = true;

    const abortController = new AbortController();
    // If the request takes longer than 2 seconds,
    // abort the request and try the secondary URL.
    const timeoutId = setTimeout(() => {
      abortController.abort();

      setGasURL(SECONDARY_URL);
    }, REQUEST_TIMEOUT_MS);

    // To convert the provided values to gwei, divide by 10
    const convertGasToWEI = (price: number) =>
      ((gasURL === URL ? price / 10 : price) * 1000000000).toString();

    fetch(gasURL, {signal: abortController.signal})
      .then((response) => {
        if (!isMounted.current) return;

        if (!response.ok) {
          // try a new endpoint
          setGasURL(SECONDARY_URL);

          throw new Error(
            'Something went wrong while getting the latest gas price.'
          );
        }

        clearTimeout(timeoutId);

        return response.json();
      })
      .then((jsonResponse: GasStationResponse) => {
        if (!isMounted.current) return;

        const {average, fast, fastest, safeLow, standard} = jsonResponse;

        setGasPrices({
          average: convertGasToWEI(average || standard),
          fast: convertGasToWEI(fast),
          fastest: convertGasToWEI(fastest),
          safeLow: convertGasToWEI(safeLow),
        });
      })
      .catch(() => {
        clearTimeout(timeoutId);

        if (!isMounted.current) return;

        // try a new endpoint
        setGasURL(SECONDARY_URL);
        setGasPrices(undefined);
      });

    return () => {
      isMounted.current = false;

      abortController.abort();

      clearTimeout(timeoutId);
    };
  }, [gasURL]);

  return gasPrices;
}
