import {useEffect, useState} from 'react';

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

      setTokenImageURL(`${window.location.origin}/favicon.ico`);
    }
  }, [account, networkId, tokenHolderBalances]);

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
