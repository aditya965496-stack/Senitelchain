import { NextResponse } from 'next/server';
import { AuditRecord } from '@/lib/types';

// In-memory persistent state (initialized clean without default mock user records)
let GLOBAL_AUDIT_STORE: AuditRecord[] = [];

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
        r.txHash.toLowerCase().includes(q) ||
        (r.actionType && r.actionType.toLowerCase().includes(q)) ||
        (r.did && r.did.toLowerCase().includes(q))
    );
  }

  // Export as CSV if requested
  if (format === 'csv') {
    const headers = 'ID,Timestamp,Action_Type,Asset_CID,Token_ID,Actor_Address,DID,Role,Gas_Used,Block_Number,Status,Tx_Hash\n';
    const rows = results
      .map(
        (r) =>
          `"${r.id}","${r.timestamp}","${r.actionType || 'Access Logged'}","${r.assetCid}","${r.tokenId || 'N/A'}","${r.userAddress}","${r.did || 'N/A'}","${r.role}","${r.gasUsed}","${r.blockNumber || 'N/A'}","${r.status}","${r.txHash}"`
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
      id: body.id || `log-${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      explorerUrl: body.explorerUrl || `https://amoy.polygonscan.com/tx/${body.txHash}`,
    };

    GLOBAL_AUDIT_STORE.unshift(newRecord);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record audit entry' }, { status: 500 });
  }
}
