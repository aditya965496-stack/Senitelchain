/**
 * Multi-Wallet Provider Manager & EIP-6963 Discovery
 * Supports MetaMask, Rabby Wallet, and Trust Wallet with zero provider conflicts.
 */

export type SupportedWalletId = 'metamask' | 'rabby' | 'trust';

export interface WalletInfo {
  id: SupportedWalletId;
  name: string;
  shortName: string;
  iconType: 'metamask' | 'rabby' | 'trust';
  description: string;
  downloadUrl: string;
  isInstalled: boolean;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

// In-memory registry of EIP-6963 announced providers
const eip6963Providers: Map<string, EIP6963ProviderDetail> = new Map();
let isEIP6963Initialized = false;

/**
 * Initialize EIP-6963 Provider Announcement Listener
 */
export function initEIP6963(): void {
  if (typeof window === 'undefined' || isEIP6963Initialized) return;

  window.addEventListener('eip6963:announceProvider', (event: any) => {
    if (event.detail && event.detail.info && event.detail.info.rdns) {
      eip6963Providers.set(event.detail.info.rdns.toLowerCase(), event.detail);
    }
  });

  // Request all active extensions to announce themselves
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  isEIP6963Initialized = true;
}

/**
 * Get all available wallet options with installation status
 */
export function getSupportedWallets(): WalletInfo[] {
  if (typeof window === 'undefined') {
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        shortName: 'MetaMask',
        iconType: 'metamask',
        description: 'The most popular EVM Web3 wallet & gateway',
        downloadUrl: 'https://metamask.io/download/',
        isInstalled: false,
      },
      {
        id: 'rabby',
        name: 'Rabby Wallet',
        shortName: 'Rabby',
        iconType: 'rabby',
        description: 'Game-changing Web3 wallet with transaction simulation',
        downloadUrl: 'https://rabby.io/',
        isInstalled: false,
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        shortName: 'Trust Wallet',
        iconType: 'trust',
        description: 'Trusted by over 140M+ Web3 users worldwide',
        downloadUrl: 'https://trustwallet.com/browser-extension',
        isInstalled: false,
      },
    ];
  }

  // Ensure EIP-6963 is active
  initEIP6963();

  const isRabbyInstalled =
    !!(window as any).rabby ||
    Array.from(eip6963Providers.values()).some(
      (p) => p.info.name.toLowerCase().includes('rabby') || p.info.rdns.includes('rabby')
    ) ||
    !!((window as any).ethereum?.isRabby);

  const isTrustInstalled =
    !!(window as any).trustwallet ||
    Array.from(eip6963Providers.values()).some(
      (p) => p.info.name.toLowerCase().includes('trust') || p.info.rdns.includes('trustwallet')
    ) ||
    !!((window as any).ethereum?.isTrust || (window as any).ethereum?.isTrustWallet);

  const isMetaMaskInstalled =
    Array.from(eip6963Providers.values()).some(
      (p) => p.info.name.toLowerCase().includes('metamask') || p.info.rdns.includes('metamask')
    ) ||
    (!!(window as any).ethereum?.isMetaMask && !isRabbyInstalled);

  return [
    {
      id: 'metamask',
      name: 'MetaMask',
      shortName: 'MetaMask',
      iconType: 'metamask',
      description: 'The standard EVM wallet with Polygon Amoy support',
      downloadUrl: 'https://metamask.io/download/',
      isInstalled: isMetaMaskInstalled,
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      shortName: 'Rabby',
      iconType: 'rabby',
      description: 'Built for multi-chain security & zero-trust simulation',
      downloadUrl: 'https://rabby.io/',
      isInstalled: isRabbyInstalled,
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      shortName: 'Trust Wallet',
      iconType: 'trust',
      description: 'Secure, multi-asset Web3 browser extension',
      downloadUrl: 'https://trustwallet.com/browser-extension',
      isInstalled: isTrustInstalled,
    },
  ];
}

/**
 * Resolve the exact EIP-1193 provider instance for the selected wallet
 */
export function getWalletProvider(walletId: SupportedWalletId): any {
  if (typeof window === 'undefined') return null;

  initEIP6963();

  // 1. Check EIP-6963 registered providers first
  for (const [, detail] of eip6963Providers.entries()) {
    const rdns = detail.info.rdns.toLowerCase();
    const name = detail.info.name.toLowerCase();

    if (walletId === 'rabby' && (rdns.includes('rabby') || name.includes('rabby'))) {
      return detail.provider;
    }
    if (walletId === 'trust' && (rdns.includes('trustwallet') || name.includes('trust'))) {
      return detail.provider;
    }
    if (walletId === 'metamask' && (rdns.includes('metamask') || name.includes('metamask'))) {
      return detail.provider;
    }
  }

  // 2. Direct extension object fallbacks
  if (walletId === 'rabby') {
    if ((window as any).rabby) return (window as any).rabby;
    if ((window as any).ethereum?.isRabby) return (window as any).ethereum;
    if ((window as any).ethereum?.providers) {
      const p = (window as any).ethereum.providers.find((prov: any) => prov.isRabby);
      if (p) return p;
    }
  }

  if (walletId === 'trust') {
    if ((window as any).trustwallet) return (window as any).trustwallet;
    if ((window as any).ethereum?.isTrust || (window as any).ethereum?.isTrustWallet) {
      return (window as any).ethereum;
    }
    if ((window as any).ethereum?.providers) {
      const p = (window as any).ethereum.providers.find(
        (prov: any) => prov.isTrust || prov.isTrustWallet
      );
      if (p) return p;
    }
  }

  if (walletId === 'metamask') {
    if ((window as any).ethereum?.providers) {
      const p = (window as any).ethereum.providers.find(
        (prov: any) => prov.isMetaMask && !prov.isRabby && !prov.isTrust
      );
      if (p) return p;
    }
    if ((window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isRabby) {
      return (window as any).ethereum;
    }
  }

  // Generic fallback to window.ethereum if installed
  return (window as any).ethereum || null;
}
