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

  function copyAddressToClipboard() {
    if (!daoTokenDetails) return;

    const copyText = document.createElement('input');
    document.body.appendChild(copyText);
    copyText.setAttribute('value', daoTokenDetails.address);
    copyText.select();
    document.execCommand('copy');
    document.body.removeChild(copyText);

    const tooltip = document.getElementById('copyTooltip');
    (tooltip as HTMLElement).innerHTML = 'copied!';
  }

  function resetCopyTooltip() {
    const tooltip = document.getElementById('copyTooltip');
    (tooltip as HTMLElement).innerHTML = 'copy address';
  }

  /**
   * Render
   */

  if (daoTokenDetails) {
    return (
      <div>
        Token: <span>{truncateEthAddress(daoTokenDetails.address, 7)}</span>
        <div className="daotoken__tooltip">
          <button
            className="daotoken__button"
            onClick={copyAddressToClipboard}
            onMouseLeave={resetCopyTooltip}>
            <span className="daotoken__tooltiptext" id="copyTooltip">
              copy address
            </span>
            <CopySVG />
          </button>
        </div>
        <div className="daotoken__tooltip">
          <button className="daotoken__button" onClick={addTokenToWallet}>
            <span className="daotoken__tooltiptext">add to wallet</span>
            <WalletSVG />
          </button>
        </div>
      </div>
    );
  }

  return <></>;
}
