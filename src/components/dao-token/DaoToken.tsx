import ReactTooltip from 'react-tooltip';

import {CopyWithTooltip} from '../common/CopyWithTooltip';
import {truncateEthAddress} from '../../util/helpers/truncateEthAddress';
import CopySVG from '../../assets/svg/CopySVG';
import WalletSVG from '../../assets/svg/WalletSVG';

export type ERC20RegisterDetails = {
  address: string;
  symbol: string;
  decimals: number;
  image: string;
};

type DaoTokenProps = {
  daoTokenDetails?: ERC20RegisterDetails;
};

export default function DaoToken({
  daoTokenDetails,
}: DaoTokenProps): JSX.Element {
  /**
   * Functions
   */

  async function addTokenToWallet() {
    if (!daoTokenDetails) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: daoTokenDetails,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Render
   */

  if (daoTokenDetails) {
    return (
      <div>
        Token:{' '}
        <CopyWithTooltip
          render={({elementRef, isCopied, setCopied, tooltipID}) => (
            <span
              data-for={tooltipID}
              data-tip={isCopied ? 'copied!' : daoTokenDetails.address}
              onClick={setCopied}
              ref={elementRef}>
              {truncateEthAddress(daoTokenDetails.address, 5)}
            </span>
          )}
          textToCopy={daoTokenDetails.address}
        />
        <ReactTooltip effect="solid" id="daotoken-address" />
        {/* Copy */}
        <CopyWithTooltip
          render={({elementRef, isCopied, setCopied, tooltipID}) => (
            <button
              className="daotoken__button"
              data-for={tooltipID}
              data-tip={isCopied ? 'copied!' : 'copy address'}
              onClick={setCopied}
              ref={elementRef}>
              <CopySVG aria-label="copy address" />
            </button>
          )}
          textToCopy={daoTokenDetails.address}
        />
        {/* Wallet */}
        <button
          className="daotoken__button"
          data-for="daotoken-wallet"
          data-tip="add to wallet"
          onClick={addTokenToWallet}>
          <WalletSVG aria-label="add to wallet" />
        </button>
        <ReactTooltip delayShow={200} effect="solid" id="daotoken-wallet" />
      </div>
    );
  }

  return <></>;
}
