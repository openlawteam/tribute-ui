import MetaMaskSVG from '../../assets/svg/MetaMaskSVG';
import WalletConnectSVG from '../../assets/svg/WalletConnectSVG';

export const WalletIconsMap: {
  injected: () => JSX.Element;
  walletconnect: () => JSX.Element;
} = {
  injected: () => <MetaMaskSVG />,
  walletconnect: () => <WalletConnectSVG />,
};
