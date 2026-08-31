import { NextResponse } from 'next/server';

export async function GET() {
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: 'HEALTHY',
    service: 'SentinelChain Zero-Trust Audit Gateway',
    version: '2.4.0-prod',
    uptimeSeconds: Math.floor(uptimeSeconds),
    timestamp: new Date().toISOString(),
    metrics: {
      heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
      rssMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
    },
    integrations: {
      polygonAmoyRpc: 'ACTIVE',
      pinataIpfs: process.env.PINATA_JWT ? 'CONFIGURED' : 'LOCAL_MULTIHASH_MODE',
      webCrypto: 'COMPLIANT_AES_256_GCM',
    },
  });
}
