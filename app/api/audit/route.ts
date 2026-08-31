import { NextResponse } from 'next/server';
import { AuditRecord } from '@/lib/types';

// In-memory persistent state (can be wired to PostgreSQL/MongoDB in production via PRISMA/DATABASE_URL)
let GLOBAL_AUDIT_STORE: AuditRecord[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-31 10:15:20 UTC',
    assetCid: 'bafybeih8392fb1039d91028',
    userAddress: '0x3a9e...7dc4',
    role: 'Admin (Issuer)',
    txHash: '0x4f82d1c9b837492048e910283746a81920384729104829103847291028374619',
    gasUsed: '48,290 gas',
    blockNumber: 12490102,
    status: 'Verified',
    explorerUrl: 'https://amoy.polygonscan.com/tx/0x4f82d1c9b837492048e910283746a81920384729104829103847291028374619',
  },
  {
    id: 'log-102',
    timestamp: '2026-08-31 09:40:11 UTC',
    assetCid: 'bafybeic2948ea9201948271',
    userAddress: '0x81bF...9368',
    role: 'Officer (Requester)',
    txHash: '0x9182374619203847291048291038472910283746192038472910482910283746',
    gasUsed: '51,400 gas',
    blockNumber: 12489950,
    status: 'Verified',
    explorerUrl: 'https://amoy.polygonscan.com/tx/0x9182374619203847291048291038472910283746192038472910482910283746',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');
  const role = searchParams.get('role');
  const search = searchParams.get('q');

  let results = [...GLOBAL_AUDIT_STORE];

  if (role && role !== 'All') {
    results = results.filter((r) => r.role.toLowerCase().includes(role.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.assetCid.toLowerCase().includes(q) ||
        r.userAddress.toLowerCase().includes(q) ||
        r.txHash.toLowerCase().includes(q)
    );
  }

  // Export as CSV if requested
  if (format === 'csv') {
    const headers = 'ID,Timestamp,Asset_CID,Actor_Address,Role,Gas_Used,Block_Number,Status,Tx_Hash\n';
    const rows = results
      .map(
        (r) =>
          `"${r.id}","${r.timestamp}","${r.assetCid}","${r.userAddress}","${r.role}","${r.gasUsed}","${r.blockNumber || 'N/A'}","${r.status}","${r.txHash}"`
      )
      .join('\n');

    return new Response(headers + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sentinel-audit-trail.csv"',
      },
    });
  }

  return NextResponse.json({
    total: results.length,
    records: results,
  });
}

export async function POST(request: Request) {
  try {
    const body: AuditRecord = await request.json();
    if (!body.assetCid || !body.txHash) {
      return NextResponse.json({ error: 'Missing required audit parameters' }, { status: 400 });
    }

    const newRecord: AuditRecord = {
      ...body,
      id: `log-${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      explorerUrl: `https://amoy.polygonscan.com/tx/${body.txHash}`,
    };

    GLOBAL_AUDIT_STORE.unshift(newRecord);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record audit entry' }, { status: 500 });
  }
}
