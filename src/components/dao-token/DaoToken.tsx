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
  erc20Details?: ERC20RegisterDetails;
};

export default function DaoToken({erc20Details}: DaoTokenProps): JSX.Element {
  /**
   * Functions
   */

  async function addTokenToWallet() {
    if (!erc20Details) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: erc20Details,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  function copyAddressToClipboard() {
    if (!erc20Details) return;
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.setAttribute('value', erc20Details.address);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  /**
   * Render
   */

  if (erc20Details) {
    return (
      <div>
        Token: <span>{truncateEthAddress(erc20Details.address, 7)}</span>
        <button
          className="daotoken__button"
          title="copy address"
          onClick={copyAddressToClipboard}>
          <CopySVG />
        </button>
        <button
          className="daotoken__button"
          title="add to wallet"
          onClick={addTokenToWallet}>
          <WalletSVG />
        </button>
      </div>
    );
  }

  return <></>;
}
