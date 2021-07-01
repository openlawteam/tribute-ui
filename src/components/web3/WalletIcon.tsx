import {WalletIconsMap} from './';

type WalletIconProps = {
  providerName: string | undefined;
};

export function WalletIcon({
  providerName,
}: WalletIconProps): JSX.Element | null {
  if (!providerName) return null;

  return (
    <span className="walletconnect__wallet-icon">
      {WalletIconsMap[providerName]()}
    </span>
  );
}
