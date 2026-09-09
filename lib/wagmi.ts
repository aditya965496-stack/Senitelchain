import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from '@wagmi/connectors/injected';

export const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://polygon-amoy.drpc.org',
        'https://rpc-amoy.polygon.technology/',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy.drpc.org'),
  },
  ssr: true,
});
