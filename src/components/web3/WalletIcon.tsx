import {lazy, Suspense} from 'react';

type WalletIconProps = {
  providerName: string | undefined;
};

/**
 * Lazy load SVG's
 */

const MetaMaskSVG = lazy(() => import('../../assets/svg/MetaMaskSVG'));

const WalletConnectSVG = lazy(
  () => import('../../assets/svg/WalletConnectSVG')
);

// Mapping of provider name to lazy component
const walletIconMap: Record<string, JSX.Element> = {
  injected: <MetaMaskSVG />,
  walletconnect: <WalletConnectSVG />,
};

export function WalletIcon({
  providerName,
}: WalletIconProps): JSX.Element | null {
  if (!providerName || !walletIconMap[providerName]) return null;

  return (
    <Suspense fallback={null}>
      <span className="walletconnect__wallet-icon">
        {walletIconMap[providerName]}
      </span>
    </Suspense>
  );
}
