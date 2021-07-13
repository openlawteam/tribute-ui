import {useCallback, useEffect, useState} from 'react';

import FadeIn from '../../components/common/FadeIn';
import {useWeb3Modal} from '../../components/web3/hooks';
import {useTokenHolderBalances} from './hooks';
import {formatNumber} from '../../util/helpers';
import {ETHERSCAN_URLS} from '../../config';

export type ERC20HolderDetails = {
  symbol: string;
  balance: number;
  tokenAddress: string;
};

type DaoTokenHolderProps = {
  backgroundColor?: string;
  border?: string;
  color?: string;
  customStyles?: Record<string, string>;
};

const image = `${window.location.origin}/favicon.ico`;

const toDataURL = (url: string) =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

export default function DaoTokenHolder({
  customStyles,
  ...badgeStyles
}: DaoTokenHolderProps): JSX.Element {
  /**
   * State
   */

  const [tokenHolder, setTokenHolder] = useState<ERC20HolderDetails>();
  const [tokenImageUrl, setTokenImageURL] = useState<string | undefined>();
  const [tokenEtherscanURL, setTokenEtherscanURL] = useState<string>('');

  /**
   * Our hooks
   */

  const {tokenHolderBalances} = useTokenHolderBalances();
  const {account, networkId} = useWeb3Modal();

  /**
   * Cached callbacks
   */

  const getTokenImageCallback = useCallback(getTokenImage, []);

  /**
   * Effects
   */

  useEffect(() => {
    setTokenHolder(undefined);

    if (account && tokenHolderBalances) {
      const {holders, symbol, tokenAddress} = tokenHolderBalances;

      const holderData = holders?.find(
        (holder: any) =>
          holder.member?.id.toLowerCase() === account.toLowerCase()
      );

      holderData &&
        setTokenHolder({
          balance: holderData.balance,
          tokenAddress,
          symbol,
        });

      account &&
        networkId &&
        setTokenEtherscanURL(
          `${ETHERSCAN_URLS[networkId]}/token/${tokenAddress}?a=${account}`
        );

      getTokenImageCallback();
    }
  }, [account, networkId, tokenHolderBalances, getTokenImageCallback]);

  /**
   * Functions
   */

  function getTokenImage() {
    try {
      toDataURL(image).then((dataUrl: any) => {
        dataUrl && setTokenImageURL(dataUrl);
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Render
   */

  if (tokenHolder) {
    return (
      <FadeIn>
        <a
          className="daotokenholder__button"
          rel="noopener noreferrer"
          target="_blank"
          href={tokenEtherscanURL}
          style={{...badgeStyles, ...customStyles}}>
          <span className="daotokenholder__balance">
            {formatNumber(tokenHolder.balance)}
          </span>
          <span className="daotokenholder__symbol">{tokenHolder.symbol}</span>

          {tokenImageUrl && <img src={tokenImageUrl} alt="Token Icon" />}
        </a>
      </FadeIn>
    );
  }

  return <></>;
}
